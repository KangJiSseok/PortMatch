# 채용공고 조회수 동시성: 실패 재현과 원자적 UPDATE

2026-09-26 KST 로컬 측정. 운영 코드 변경 전에 실패를 확인하고 증거를 보존한 뒤 수정했다. 비교 대상 테스트와 초기화 SQL은 수정 전후 동일하다.

## 문제와 실제 트랜잭션 경계

`GET /api/job-postings/{id}`는 `JobPostingController`에서 `updateViewCount(id)`를 호출하고, 반환 후 `getJobDetail(id)`를 호출한다.

- 증가 서비스에는 `jakarta.transaction.Transactional`이 있다. 기존 Repository `findById()`는 이 트랜잭션에 참여하고, Java에서 변경한 엔티티를 커밋 시 Hibernate dirty checking으로 UPDATE한다.
- 상세 조회 서비스 자체에는 트랜잭션이 없다. 내부 Repository `findById()`는 증가 커밋 후 별도의 읽기 전용 트랜잭션을 시작한다. 실제 `JpaTransactionManager` 로그에서도 확인했다.
- OSIV 때문에 **한 요청 안에서는** 두 트랜잭션이 같은 EntityManager를 사용할 수 있다. 기존 상세 조회는 1차 캐시를 이용해 공고 SELECT를 생략하기도 한다. **서로 다른 요청은** 다른 Session과 DB 트랜잭션을 사용한다.
- 엔티티에 `@Version`, `@DynamicUpdate`가 없고 기존 원자적 증가 쿼리도 없다. 호출 경로의 LoggingAspect는 로그만 남기며 동기화하지 않는다. 스케줄러의 공고 마감 처리는 조회수를 증가시키지 않는다.
- 조사한 로컬 실험 DB와 테스트 DB의 격리 수준은 `READ COMMITTED`다. 로컬 실험 DB의 `job_postings`에는 사용자 정의 트리거가 없고 `vcnt`는 NOT NULL이다. 운영 DB를 직접 조사한 결과는 아니다.

WAS 2대가 같은 DB에 접속하면 독립 트랜잭션이 동시에 조회수 100을 읽을 수 있다. 양쪽 Java 코드가 101을 계산한 뒤 저장하면 UPDATE 자체의 행 잠금으로 실행 순서가 정해져도 두 번째 요청이 다시 101을 저장한다. 성공한 요청 2건 중 증가 1건이 유실된다. 단순히 `@Transactional`을 붙이는 것으로 이 read-modify-write 전체가 직렬화되지는 않는다.

## 실험 환경과 재현 방법

- Spring Boot 3.5.9, Java Temurin 21.0.9, Gradle 8.14.3, Docker 28.5.1.
- 기존 Testcontainers 의존성 사용. `pgvector/pgvector:pg17` 격리 컨테이너에서 실제 PostgreSQL 17.7(aarch64), READ COMMITTED로 측정했다. 이미지 ID는 [environment.json](evidence/job-posting-view-count/environment.json)에 기록했다.
- `@DataJpaTest`에 실제 서비스 프록시·Repository를 연결하고, MockMvc가 실제 Controller와 요청별 OSIV 필터를 실행한다. 테스트 전체 트랜잭션은 `NOT_SUPPORTED`로 비활성화했다. 외부 협력 객체만 Mock이며 DB와 조회수 경로는 실제 구현이다.
- 각 반복마다 커밋된 신규 공고의 조회수를 100으로 설정하고, 종료 후 JDBC로 최종값을 읽는다. 테스트 정리도 JDBC로 수행한다.
- 결정적 실험: 요청 2개, 스레드 2개, 20회. 테스트 전용 `StatementInspector`가 UPDATE 실행 직전 `CyclicBarrier`에서 기다린다. 기존 코드의 두 SELECT와 Java 증가가 끝난 후 UPDATE를 함께 진행시킨다. 양쪽 바인딩 값이 101인 SQL 로그를 보존했다.
- 동일 hook은 수정 후 원자적 UPDATE 실행 직전에도 적용된다. UPDATE 후 잠금을 잡은 상태에서 기다리지 않는다. 두 트랜잭션에서 기존 값 100, 서로 다른 Session UUID·`pg_backend_pid()`·`txid_current()`를 검사한다. hook 내부 JDBC 관찰 SELECT는 테스트 전용이며 운영 쿼리가 아니다.
- 부하 실험: 총 1,000건, 동시 실행 스레드 20개, 10회. 시작 latch만 사용하고 UPDATE barrier와 관찰 SELECT는 사용하지 않는다. **1,000개의 스레드를 동시에 실행한 실험은 아니다.**
- 성공 요청은 증가 커밋 후 HTTP 200, 응답 `status=true`, 공고 ID·제목 검증이 완료된 MockMvc 요청이다. Future 오류는 실패 건수로 기록한다. barrier 30초, Future 90초, 스레드 종료 30초 제한을 둔다.

첫 준비 실행에서 전체 엔티티 DDL의 기존 오류(`company_scraps`의 `unique(uid,cid)`와 실제 `user_id,company_cid` 불일치)가 드러났다. 관련 없는 엔티티를 수정하지 않고, 테스트 전용 SQL로 조회 경로의 `job_postings`, `posting_stacks`만 만들었다. `ddl-auto=none`으로 고정했다. 또한 없는 공고의 HTTP 상태는 기존 예외 처리기상 404가 아닌 **400, 응답 코드 2001**임을 반영한 뒤 최종 비교 테스트를 고정했다. 준비 실행은 `setup/`에 별도로 보존했으며 아래 비교 집계에는 포함하지 않는다.

## 실제 수정 전후 결과

### 결정적 동시 요청 2건

20회 모두 아래와 동일했다.

| 항목 | 수정 전 | 수정 후 |
| --- | ---: | ---: |
| 초기 조회수 | 100 | 100 |
| 병렬 요청 수 | 2 | 2 |
| 성공 요청 수 | 2 | 2 |
| 예상 최종 조회수 | 102 | 102 |
| 실제 최종 조회수 | 101 | 102 |
| 유실된 증가 수 | 1 | 0 |
| 불변식 충족 여부 | 실패 | 성공 |
| 불변식 통과 횟수 | 0/20 | 20/20 |

첫 반복의 독립성 증거:

| 구분 | DB 연결 PID | DB 트랜잭션 ID | UPDATE 직전 조회수 |
| --- | ---: | ---: | ---: |
| 수정 전 요청 1 | 70 | 10768 | 100 |
| 수정 전 요청 2 | 69 | 10767 | 100 |
| 수정 후 요청 1 | 69 | 10767 | 100 |
| 수정 후 요청 2 | 70 | 10768 | 100 |

Session UUID와 SQL 전체 순서는 [수정 전 SQL](evidence/job-posting-view-count/before/sql-sample.log), [수정 후 SQL](evidence/job-posting-view-count/after/sql-sample.log)에 있다. 수정 전후는 별도 DB 컨테이너여서 숫자 ID가 재사용될 수 있다. 독립성 검증은 각 실행 내부의 두 요청을 비교한다.

### 1,000건 부하, 동시 실행 20개

첫 반복의 비교다. 아래 반복별 표와 CSV에 모든 결과를 공개한다.

| 항목 | 수정 전 | 수정 후 |
| --- | ---: | ---: |
| 초기 조회수 | 100 | 100 |
| 병렬 처리한 총 요청 수 | 1,000 | 1,000 |
| 동시 실행 스레드 수 | 20 | 20 |
| 성공 요청 수 | 1,000 | 1,000 |
| 예상 최종 조회수 | 1,100 | 1,100 |
| 실제 최종 조회수 | 170 | 1,100 |
| 유실된 증가 수 | 930 | 0 |
| 불변식 충족 여부 | 실패 | 성공 |

| 반복 | 수정 전 최종값 | 수정 전 유실 | 수정 후 최종값 | 수정 후 유실 |
| --- | ---: | ---: | ---: | ---: |
| 1 | 170 | 930 | 1100 | 0 |
| 2 | 159 | 941 | 1100 | 0 |
| 3 | 156 | 944 | 1100 | 0 |
| 4 | 150 | 950 | 1100 | 0 |
| 5 | 145 | 955 | 1100 | 0 |
| 6 | 161 | 939 | 1100 | 0 |
| 7 | 148 | 952 | 1100 | 0 |
| 8 | 155 | 945 | 1100 | 0 |
| 9 | 146 | 954 | 1100 | 0 |
| 10 | 164 | 936 | 1100 | 0 |

수정 전 부하 10회에서 증가 9,446건이 유실됐다. 수정 후 10회는 모두 최종값 1,100, 유실 0건이다.

| 검증 | 수정 전 | 수정 후 |
| --- | ---: | ---: |
| 결정적 실험 불변식 통과율 | 0/20 (0%) | 20/20 (100%) |
| 부하 실험 불변식 통과율 | 0/10 (0%) | 10/10 (100%) |
| 두 실험의 요청 성공 건수 | 10,040/10,040 | 10,040/10,040 |
| 단일 상세 조회·필드 보존·NOT_FOUND 테스트 | 1/1 | 1/1 |
| 조회수 테스트 전체 | 1/31 | 31/31 |
| 기존 Backend 테스트 | 5/5 | 5/5 |

Backend 전체 회귀 실행은 **36/36 통과, 실패·스킵 0**이었다. 이 실행에서 동시성 실험도 추가로 같은 횟수만큼 다시 수행되어 모두 통과했다. 따라서 수정 후 두 실행을 합치면 결정적 실험 40/40, 부하 실험 20/20 통과다. 위 비교표는 공정한 전후 비교를 위해 각각 첫 확정 실행만 사용했다.

## 최소 변경과 선택 이유

최초 수정 및 위 전후 측정 시점에는 Repository에 다음 JPQL을 추가했다.

```java
@Modifying(clearAutomatically = true, flushAutomatically = true)
@Query("UPDATE JobPostingEntity j SET j.vcnt = j.vcnt + 1 WHERE j.id = :id")
int incrementViewCount(@Param("id") Long id);
```

서비스는 기존 트랜잭션 안에서 이 메서드를 호출하고, 갱신 행 수가 0일 때 기존 `BusinessException(ResponseCode.NOT_FOUND)`를 던진다. 사용하지 않는 엔티티 `incrementVcnt()`는 삭제했다. 벌크 UPDATE 후 영속성 컨텍스트를 비워 상세 조회가 오래된 엔티티 값을 사용하지 않도록 한다.

수정 전 Hibernate가 실제 생성한 UPDATE는 조회수 외 필드까지 포함하며, 양쪽 요청 모두 `vcnt`에 101을 바인딩했다.

```sql
SELECT id, active, cid, detail, end_date, job_type, start_date, title, vcnt
FROM job_postings WHERE id = ?;

UPDATE job_postings
SET active=?, cid=?, detail=?, end_date=?, job_type=?, start_date=?, title=?, vcnt=?
WHERE id=?;
-- 두 요청 모두 vcnt = 101
```

수정 후 실제 Hibernate SQL:

```sql
UPDATE job_postings jpe1_0
SET vcnt=(jpe1_0.vcnt+1)
WHERE jpe1_0.id=?;
```

증가 트랜잭션의 선행 엔티티 SELECT가 없어졌고, 커밋 후 상세 조회용 SELECT는 남아 있다. READ COMMITTED의 동시 UPDATE는 해당 행의 쓰기 잠금을 이용해 처리되며, 대기하던 증가도 최신 행의 조회수에 1을 더한다. Java에서 계산한 오래된 값을 덮어쓰지 않는다.

- 낙관적 락은 버전 컬럼과 충돌 재시도 정책이 필요하다. 단순 증가를 SQL 한 문장으로 처리할 수 있어 추가하지 않았다.
- 명시적 비관적 락은 증가 전에 SELECT FOR UPDATE로 읽기부터 잠그는 단계가 필요하다. UPDATE 자체가 제공하는 DB 쓰기 잠금으로 충분하다. **원자적 UPDATE가 잠금을 전혀 사용하지 않는다는 뜻은 아니다.**
- JVM `synchronized`는 다른 WAS 프로세스의 요청을 조정하지 못한다. 새 의존성·운영 hook·sleep·스키마 마이그레이션은 없다.

## 실행 명령과 증거

프로젝트 루트에서 실행했다. Docker가 실행 중이어야 한다.

```bash
JAVA_HOME=$(/usr/libexec/java_home -v 21) Backend/gradlew -p Backend test \
  --tests '*JobPostingViewCountConcurrencyTest' --rerun-tasks

# 기존 테스트만 수정 전 기준선 측정
JAVA_HOME=$(/usr/libexec/java_home -v 21) Backend/gradlew -p Backend test \
  --tests '*BackendApplicationTests' --tests '*ChatPublicationTest' --rerun-tasks

# 수정 후 전체 회귀
JAVA_HOME=$(/usr/libexec/java_home -v 21) Backend/gradlew -p Backend test --rerun-tasks
```

테스트 실행 결과는 `Backend/build/view-count-results.csv`에 헤더 없이 추가된다. 각 독립 측정 전에 해당 산출물만 비우고 실행했다. 일반 JUnit XML에는 SQL·바인딩·트랜잭션 로그와 실패 assertion이 들어 있다. Gradle의 테스트 실패 종료 코드 1은 수정 전 재현에서 의도한 결과다.

확정 측정 증거는 [evidence/job-posting-view-count](evidence/job-posting-view-count)에 보존했다.

- `before/`, `after/`: 헤더가 있는 `results.csv`, `metadata.json`, `gradle.log`, `sql-sample.log`, 원본 `test-results.xml.gz`.
- `before/`: 기존 테스트 기준선 XML과 `existing-tests.log`도 포함한다.
- `regression/`: 전체 회귀 XML·로그·요약과 추가 동시성 측정 CSV.
- `setup/`: 준비 중 DDL 실패와 HTTP 상태 기대값 정정 전 예비 실행. 정식 전후 비교에서 제외한다.
- `environment.json`, `production.patch`, `SHA256SUMS`: 환경, 실제 운영 변경, 증거 무결성 목록.

기준 커밋은 `98e23cbb065b3e07c6c0d8212ca82619c2efd849`다. 수정 전 재현은 별도 체크아웃에서 이 기준 커밋에 새 테스트 Java·SQL 두 파일만 복사하여 실행할 수 있다. 현재 작업 디렉터리에서 운영 코드를 되돌릴 필요는 없다.

전후 테스트 Java의 SHA-256:

```text
6e633d6371b06e7bc7bcb44a4d4fbd72f558736ccf962190c52083dfc83144d9
```

초기화 SQL의 SHA-256:

```text
c8c1ea4fd32d1899425d54eb464bc2c78a90442a7c444ab0f687b570d3b85da9
```

## 변경 파일과 한계

운영 변경은 다음 세 파일이다.

- `Backend/src/main/java/com/portmatch/domain/jobposting/repository/JobPostingRepository.java`
- `Backend/src/main/java/com/portmatch/domain/jobposting/service/JobPostingServiceImpl.java`
- `Backend/src/main/java/com/portmatch/domain/jobposting/entity/JobPostingEntity.java`

추가 파일은 테스트 `Backend/src/test/java/com/portmatch/domain/jobposting/JobPostingViewCountConcurrencyTest.java`, 초기화 SQL `Backend/src/test/resources/db/view-count-init.sql`, 이 보고서와 전용 증거 디렉터리다. 기존 미추적 실험 자료는 수정하지 않았다.

- 한 JVM에서 실제 PostgreSQL에 독립 트랜잭션을 동시 실행한 테스트다. 두 WAS JVM·로드밸런서·네트워크를 통과한 운영 부하 측정이나 처리량 개선 수치는 아니다. MockMvc standalone 구성으로 인증 필터 전체를 검증하지 않는다.
- 공고 fixture는 회사 연결이 없고 기술 스택이 비어 있다. 실제 조회수 트랜잭션, 상세 DTO 변환과 빈 관계 조회를 검증한다. 전체 운영 스키마 호환성 검증은 아니다.
- 증가가 커밋된 뒤 상세 조회·응답이 실패하면 실패 요청도 증가에 반영될 수 있다. 기존 두 트랜잭션 구조를 유지했으므로 모든 장애 상황에서 HTTP 성공 건수와 증가량이 같다고 보장하지 않는다.
- 다른 공고 수정의 Hibernate 전체 컬럼 UPDATE가 조회수를 덮어쓰는 경쟁, 동시 삭제, 정수 범위 초과, 중복 조회 정책은 이번 검증 범위 밖이다.
- 반복 측정의 100%는 실행한 사례에 대한 통과율이다. 모든 환경의 무조건적인 보장이나 운영 실측 성과로 표현하지 않는다.
- 기존 전체 DDL 오류는 수정하지 않았다. 기존 Lombok builder 경고 및 Gradle deprecation 경고도 남아 있지만 테스트 실패는 없다.

## 후속 정리: 불필요한 자동 flush·clear 제거

현재 호출 경로는 공고 엔티티를 조회·수정하기 전에 조회수 UPDATE를 실행한다. 따라서 선행 변경을 강제로 flush하거나 이미 조회한 공고를 clear할 필요가 없어 `@Modifying`만 남겼다. 원자적 `vcnt = vcnt + 1`, 서비스 트랜잭션, NOT_FOUND 처리는 유지한다. 위 비교표와 원본 증거는 두 옵션이 있던 최초 측정 결과로 보존한다.

향후 공고를 먼저 조회·수정한 영속성 컨텍스트에서 이 메서드를 재사용한다면 flush 및 오래된 엔티티 처리 필요성을 다시 검토해야 한다.

옵션 제거 후 동일 테스트 소스와 초기화 SQL을 유지한 채 `Backend/gradlew -p Backend test --rerun-tasks`를 Java 21로 실행해 전체 36개 테스트가 실패·스킵 없이 통과했다. 결정적 동시성 실험 20회와 1,000건 부하 실험 10회도 모두 통과했다.
