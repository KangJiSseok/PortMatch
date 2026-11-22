# PortMatch 공고 화면 흐름

현재 벤치마크는 페이지네이션 적용 커밋 `8f221f0`의 목록 계약을 사용한다. 아래 HTTP 흐름은 프런트 소스에서 확인했으며, 브라우저 렌더링과 공통 채팅 트래픽은 테스트 범위에서 제외한다.

## 현재 화면에서 재현하는 요청

| 화면 | 요청 순서 |
|---|---|
| 공고 목록 | `GET /api/job-postings?page=0&sort=latest…` → 첫 페이지의 고유 스택 이름과 스택 정보가 없는 공고별 보완 조회 |
| 검색 제출 | `GET /api/job-postings?page=0&keyword=…`와 `GET /api/companies/search?keyword=…` 병렬 요청 → 검색 페이지 스택 보완 조회 |
| 공고 상세 | `GET /api/job-postings/{id}` → 스크랩 여부 → 공고 스택 → 기업별 공고 → 다른 공고들의 스택 이름 병렬 조회 |
| 스크랩 | `POST /api/scraps?uid=…&pid=…` → 마이페이지의 `auth/me` → `scraps/{uid}` → 저장 공고별 상세 병렬 조회 |

상세 GET은 조회수를 증가시킨다. 기업별 공고 호출은 현재 그 기업의 전체 공고를 반환한다. 목록과 검색의 페이지 크기는 20건이다. 스택 이름을 가져온 다음 같은 화면 흐름 내 목록 검색에서 캐시를 재사용한다.

## 측정 조건

한 iteration은 로그인된 지원자의 공고 목록 → 검색 → 상세 흐름이다. 약 30%는 스크랩과 마이페이지 검증까지 실행한다. 이는 운영 사용량에서 추정한 값이 아닌 실험 가정이다. 화면 사이에는 2초의 대기를 적용하고 응답 지연 지표에서는 뺀다. 24개 테스트 계정에 세션을 준비하고, 성능 단계마다 각 계정의 초기 스크랩을 5개로 맞춘다.

10만 건 시드는 한 기업당 공고 10건이고, 5천 건 시드는 공고가 한 기업에 몰려 있다. 상세의 기업별 API 호출량이 달라지므로 데이터 크기 외에도 이 차이를 기록한다. 단일 흐름 확인 후 분당 6·12·24·48 흐름을 각 3분씩 실행하고, 성공 흐름, 검증된 HTTP RPS, API·화면별 p95/p99, 누락을 기록한다.

[로컬 재현 절차](README.md) · [상세 측정 기록](DETAILED-RESULTS.md) · [10만 건 시드](sql/seed-100k.sql)

## 페이지네이션 이전 화면과 API

| 화면·행동 | 호출 순서와 조건 |
|---|---|
| 공고 목록 첫 진입 `/job-postings` | `GET /api/job-postings`로 모든 공고를 가져온다. 화면의 첫 10개 선택과 정렬은 브라우저에서 한다. 응답을 받은 뒤 목록 응답 전반의 고유 스택 ID에 대해 `GET /api/stacks/{stackId}`를 병렬 호출한다. 보이는 10건 중 `stackIds`가 비어 있는 공고는 `GET /api/stacks/posting/{postingId}`도 병렬로 호출한다. |
| 상단 검색창에서 검색 제출 | URL을 `/job-postings?keyword=…`로 바꾸고 이미 가져온 공고의 제목을 브라우저에서 필터링한다. 키워드가 있으면 `GET /api/companies/search?keyword=…`를 별도 호출한다. 공고 목록 쿼리 키에 키워드가 없어 같은 목록에 머무는 검색은 공고 목록을 바로 재요청하지 않는다. 목록 캐시 freshness는 30초다. 검색 URL로 처음 진입하면 목록과 기업 검색이 함께 시작될 수 있다. |
| 검색 결과에서 상세 클릭 `/job-posts/{pid}` | `GET /api/job-postings/{pid}` → 로그인한 지원자라면 `GET /api/scraps/check?uid=…&pid=…` → `GET /api/stacks/posting/{pid}` → 기업 CID가 있으면 `GET /api/job-postings/company/{cid}`. 기업 공고 응답 이후, 현재 공고를 뺀 나머지 공고의 고유 스택 ID에 대해 `GET /api/stacks/{stackId}`를 병렬 호출한다. 상세 GET은 DB 조회수를 증가시킨다. |
| 상세 화면에서 스크랩 클릭 | `POST /api/scraps?uid=…&pid=…` 한 건으로 등록·해제를 토글한다. 성공 응답의 boolean으로 화면 상태를 갱신한다. 클릭 직후 별도 상태 확인 GET은 발생하지 않는다. |
| 마이페이지 `/mypage`에서 관심 공고 열기 | 마이페이지 진입 시 `GET /api/auth/me` → `GET /api/scraps/{uid}` → 저장된 공고별 `GET /api/job-postings/{pid}`를 병렬 호출한다. 관심 공고 모달 버튼은 정상 로드된 결과를 표시하고, 조회 오류 상태에서만 재조회한다. 마이페이지는 이와 별도로 면접 목록·임박한 면접을 위해 `auth/me → interviews/user/{uid}`를 각각 호출하고, 관심 회사용 `auth/me → company-scraps/{uid} → companies/{cid}` 분기도 실행한다. |

기존 기준선에서 호출한 `/api/job-postings/latest`와 `/api/job-postings/search`는 위 공고 목록·검색 화면의 주 호출과 다르다. 화면 흐름의 핵심은 전체 목록 응답, 브라우저 필터링, 조건부 스택 호출이다. 화면의 정적 자원과 공통 채팅 WebSocket은 이번 HTTP 흐름 범위에서 제외한다.
