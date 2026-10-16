# 채팅 Outbox 커밋 직후 비동기 발행

## 구현

`CHAT_PUBLISH_MODE=outbox`에서 메시지와 Outbox 저장 트랜잭션이 커밋되면 기존 `outbox-after-commit` 장애 훅을 실행한 뒤 전용 실행기에 eventId를 등록한다. 요청 스레드는 선점이나 RabbitMQ confirm을 기다리지 않는다. 롤백 시 등록하지 않는다.

실행기는 기본 고정 2개 스레드와 대기열 100개를 사용한다. 포화 또는 종료 시 AbortPolicy로 즉시 거절하고 `chat.outbox.dispatch.rejected` 카운터와 로그를 남긴다. Outbox는 PENDING으로 남아 스케줄러가 처리한다. 종료 시 접수를 중단하고 기본 10초 기다린 뒤 남은 작업을 취소·인터럽트한다. 인터럽트를 무시하는 외부 호출의 강제 종료까지 보장하지는 않는다.

즉시 경로와 스케줄러는 `ChatOutboxWorker.publishOne(eventId)`를 공유한다.

1. `REQUIRES_NEW` 트랜잭션에서 해당 행을 `FOR UPDATE SKIP LOCKED`로 선점한다. 도래한 PENDING 또는 lease가 만료된 PROCESSING만 대상이다.
2. attempts를 증가시키고 기본 60초 lease를 설정한 뒤 커밋한다.
3. DB 트랜잭션 밖에서 역직렬화, 기존 Publisher 재시도 및 confirm 대기를 수행한다.
4. 별도 `REQUIRES_NEW` 트랜잭션에서 `event_id + PROCESSING + attempts` 조건으로 완료 또는 실패를 갱신한다.

스케줄러는 batch-size만큼 후보 ID만 읽고 발행 직전에 하나씩 선점한다. 재선점된 작업보다 늦게 끝난 작업은 갱신 0건으로 종료한다. 아직 재선점되지 않은 동일 세대의 완료는 lease 만료 후에도 허용한다. 마지막 허용 시도 중 프로세스가 종료된 경우에도 lease 만료 후 FAILED로 수렴한다.

confirm 뒤 DB 갱신 실패는 실패 발행으로 다시 기록하지 않는다. PROCESSING이 남으면 lease 만료 후 복구한다. `direct-after-commit`, `outbox-after-commit`, `outbox-after-confirm`, `consumer-after-process` 장애 지점은 유지했다.

## 설정과 적용

| 환경 변수 | 기본값 |
|---|---:|
| CHAT_PUBLISH_MODE | direct |
| CHAT_OUTBOX_POLL_DELAY_MS | 250 |
| CHAT_OUTBOX_BATCH_SIZE | 100 |
| CHAT_OUTBOX_LEASE_SECONDS | 60 |
| CHAT_OUTBOX_EXECUTOR_THREADS | 2 |
| CHAT_OUTBOX_EXECUTOR_QUEUE_CAPACITY | 100 |
| CHAT_OUTBOX_EXECUTOR_SHUTDOWN_WAIT_SECONDS | 10 |

기본 direct 모드는 유지한다. Outbox 사용 환경에서 `CHAT_PUBLISH_MODE=outbox`를 지정한다. DB 마이그레이션, 외부 API, 이벤트 payload 변경은 없다.

기존 Worker는 attempts 소유권 검사 없이 상태를 갱신한다. **구버전 Outbox 발행 인스턴스를 중지한 뒤 신버전으로 교체해야 한다.** 신·구 Worker를 섞어서 실행하지 않는다. 남은 PENDING 및 만료된 PROCESSING은 신버전 스케줄러가 처리한다. 이 변경 작업에서 운영 배포나 실행 중인 애플리케이션 교체는 수행하지 않았다.

## 재현

Java 21과 Docker가 필요하다. 테스트는 Testcontainers의 독립 PostgreSQL/RabbitMQ를 사용한다. 기존 실험 DB와 결과를 초기화하지 않는다.

```bash
# macOS, 프로젝트 루트
JAVA_HOME=$(/usr/libexec/java_home -v 21) bash experiment/experiment.sh verify-outbox

# 전체 Backend 회귀 테스트 (측정도 포함)
RUN_CHAT_OUTBOX_BENCHMARK=true JAVA_HOME=$(/usr/libexec/java_home -v 21) \
  Backend/gradlew -p Backend test
```

`verify-outbox`는 채팅 테스트를 다시 실행한다. 벤치마크 결과는 `Backend/build/reports/chat-outbox-benchmark.json`에 출력한다. 일반 테스트에서는 `RUN_CHAT_OUTBOX_BENCHMARK=true`가 없으면 성능 측정만 건너뛴다.

[전체 Backend 테스트 결과](evidence/chat-outbox/backend-tests.json): 56개 통과, 실패·오류·건너뜀 0개. 채팅 관련 24개를 포함한다.

검증 항목:

- 실제 JPA 트랜잭션 커밋 전 미발행 및 롤백 시 메시지·Outbox·등록 모두 없음.
- 스케줄러 없이 즉시 발행, MQ 대기 중 요청 반환 및 별도 연결에서 행 잠금 획득.
- 서로 다른 Worker 객체와 스케줄러의 경쟁, 잠긴 행 건너뛰기.
- 재선점된 작업이 PROCESSING인 동안 이전 작업의 늦은 성공·실패 차단.
- 재시도 시각, 최대 시도 도달 실패 및 마지막 시도의 lease 만료 처리.
- 실행기 포화 시 요청 스레드에서 실행하지 않고 스케줄러가 복구, 제한된 종료 대기.
- confirm 뒤 DB 갱신 오류 시 PROCESSING 유지 및 재발행 복구.
- 실제 RabbitMQ에서 반환 메시지 실패 처리, 라우팅 복구 후 confirm 및 완료.
- ack/nack/timeout/returned 결과 분기. timeout은 Future 예외로 주입하며 실제 10초 네트워크 타임아웃 실험은 아니다.
- 소비자 동일 eventId 순차·동시 중복 억제. STOMP 호출 1회 검증이며 브라우저 수신 확인이 아니다.
- 기본·명시적 direct 및 outbox 전략 선택.

## Backend 2대 실제 장애 테스트 — 2026-10-16 추가 실행

[실행 결과 원본](evidence/chat-outbox/outbox-chaos-20261016-001306/results.json) · [전체 테스트 재실행 결과](evidence/chat-outbox/outbox-chaos-20261016-001306/backend-tests.json) · [서버 간 WebSocket 수신](evidence/chat-outbox/outbox-chaos-20261016-001306/stomp-check.json)

Java 21에서 전체 테스트와 bootJar를 새로 빌드했고 56개 테스트가 모두 통과했다. 해당 JAR를 독립 Docker 프로젝트의 Backend 2대에 읽기 전용으로 마운트하여 실행했다. 원본 결과의 jarSha256은 실제 컨테이너 내부 JAR와 대조했다. PostgreSQL, RabbitMQ, Redis, Toxiproxy, Nginx도 별도로 띄웠다. 기존 실행 환경·DB·과거 결과는 보존했고 테스트 전용 컨테이너·볼륨은 실행 후 제거했다.

| 시나리오 | HTTP 성공 / 요청 | DB 커밋 / 소비자 고유 처리 | 중복 발행 / 중복 소비 | 결과 |
|---|---:|---:|---:|---|
| 정상, 초당 50건 | 200 / 200 | 200 / 200 | 0 / 0 | 통과 |
| 폴링 간격 1시간 | 100 / 100 | 100 / 100 | 0 / 0 | 즉시 발행 통과 |
| 커밋 직후 프로세스 종료 | 95 / 100 | 96 / 96 | 0 / 0 | 커밋된 이벤트 모두 복구 |
| confirm 직후 프로세스 종료 | 97 / 100 | 97 / 97 | 1 / 1 | lease 만료 후 재발행·중복 억제 |
| MQ 응답 차단 15초 + 실행기 포화 | 100 / 100 | 100 / 100 | 2 / 2 | 등록 거절 75건 복구 |
| 소비자 처리 직후 프로세스 종료 | 96 / 100 | 96 / 96 | 0 / 1 | 재전달 중복 억제 |

700회 요청 중 689건이 커밋됐고 689건 모두 브로커 관측·소비자 고유 처리까지 완료됐다. 모든 시나리오 종료 시 PENDING / PROCESSING / FAILED는 각각 0건이다. 프로세스 종료 구간의 HTTP 실패 12건 중 1건은 커밋 후 응답 실패이며 나머지 11건은 커밋되지 않았다. 요청 성공률과 커밋된 메시지의 복구 성공률을 구분해야 한다.

세 종료 지점은 Docker exitCode 137 이벤트와 [Redis 장애 훅 실행 기록](evidence/chat-outbox/outbox-chaos-20261016-001306/chaos-trigger-keys.json)으로 확인했다. confirm 직후 종료 이벤트는 [복구 전](evidence/chat-outbox/outbox-chaos-20261016-001306/after-confirm-mid-recovery.json) PROCESSING / attempts=1이었다. 기본 lease 60초가 지난 뒤 [복구 후](evidence/chat-outbox/outbox-chaos-20261016-001306/after-confirm-recovered.json) PUBLISHED / attempts=2가 됐고 소비 시도 2건, 고유 처리 1건을 확인했다.

MQ 장애 시나리오만 실행기를 스레드 1개·대기열 2개로 제한했다. [활성 Toxiproxy 기록](evidence/chat-outbox/outbox-chaos-20261016-001306/mq-active-toxic.json)에 응답 방향 timeout 15초가 확인된다. 요청 100건은 약 4.97초에 모두 반환됐고 API p95는 약 54.55ms였다. 실행기 등록 거절 75건은 스케줄러가 복구했다. Publisher 내부 재시도 때문에 중복 발행이 2건 발생했지만 고유 처리 수는 100건이다.

Backend 1의 HTTP 전송 → Backend 2의 WebSocket 구독 수신도 별도 1건 통과했다. 이 확인은 장애 중 모든 브라우저가 메시지를 받았다는 뜻은 아니다. 단일 호스트에서 수행한 기능·복구 실험이며 장시간 부하, 실제 네트워크가 분리된 서버, 구버전 대비 성능 비교는 아니다.

실험 도구도 보완했다. 기존 Toxiproxy 생성 요청은 `/toxics/outage`로 보내 실패 응답을 무시할 수 있었다. `/toxics`에 이름 `outage`로 생성하고 HTTP 결과를 검사하도록 수정했다. 기존 과거 실험의 수치는 수정하지 않았으며 그 장애 주입 성공 여부를 이번 결과로 소급 보장하지 않는다. 결과 집계에는 기존에 빠졌던 PROCESSING 잔량과 Outbox 재선점 횟수도 추가했다.

재현 명령:

```bash
RUN_CHAT_OUTBOX_BENCHMARK=true JAVA_HOME=$(/usr/libexec/java_home -v 21) \
  Backend/gradlew -p Backend test bootJar --rerun-tasks
python3 experiment/scripts/verify-outbox-chaos.py
```

Docker·Node·Python 3.9 이상과 `portmatch-chat-experiment:local` 이미지가 필요하다. 이미지가 없으면 `docker compose -f experiment/docker-compose.yml build backend1`로 먼저 생성한다. 실행기는 새 JAR를 마운트하므로 기존 이미지 내부의 구버전 JAR를 실행하지 않는다. 25432 / 25672 / 28474 / 28080–28082 포트를 사용한다. 실행마다 별도 프로젝트·볼륨·결과 폴더를 만들며 각 시나리오의 초기화는 그 실행 전용 DB/큐에만 적용한다. 실제 로그와 Docker 종료 이벤트는 결과 폴더에 보존된다.


## 소규모 지연 측정 — 2026-10-16

[원본 측정값](evidence/chat-outbox/dispatch-benchmark.json)

로컬 단일 JVM, PostgreSQL 17, RabbitMQ 4.1, 경로별 60건, 전송 사이 50ms 대기, 폴링 간격 250ms, 즉시 실행기 2개 스레드로 측정했다. 동일한 새 Worker에서 즉시 등록을 생략한 polling-only와 즉시 등록을 켠 경로를 비교했다. 구버전 전체 구현이나 Backend 2대의 HTTP 성능 비교가 아니다. 반복 측정·워밍업 분리가 없는 소규모 확인 수치다.

| 지표 (ms, p50 / p95 / p99) | polling-only | 즉시 등록 |
|---|---|---|
| afterCommit 진입 → 발행 호출 시작 | 147.65 / 268.93 / 291.56 | 3.65 / 6.28 / 6.99 |
| afterCommit 진입 → confirm 완료 | 151.24 / 271.00 / 295.25 | 6.88 / 11.59 / 12.38 |
| 트랜잭션 호출 전체 | 7.40 / 12.55 / 18.50 | 9.82 / 18.13 / 82.19 |

양쪽 모두 60건 발행되었고 미발행 잔량은 0이다. 즉시 경로에서 폴링 대기 지연이 줄었지만 트랜잭션 호출 p99가 개선되지는 않았다. 이 수치로 API 응답시간 개선을 주장하지 않는다. afterCommit 진입은 관측 기준점이며 DB의 정확한 커밋 시각이 아니다. 기존 created_at → consumer.processed_at 지표와도 구분한다.

## 보장 범위

중복 발행은 가능하다. confirm 응답 유실, confirm 직후 종료, lease 만료 후 재선점 때문에 동일 eventId가 여러 번 MQ에 들어갈 수 있다. 소비자 중복 억제를 유지하며 exactly-once, 방 내부 MQ 도착 순서, 브라우저 수신을 보장하지 않는다. 소비 기록 커밋 후 STOMP 전송 전에 종료되는 간극도 남는다. FAILED는 자동 무한 재처리하지 않고 운영 확인 대상으로 남긴다.
