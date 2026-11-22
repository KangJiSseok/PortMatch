# PortMatch 부하 테스트 재현

동일한 공고 데이터를 로컬 Docker에서 만들고, Mac 또는 Linux 호스트에서 k6로 호출한다. 공고 화면 흐름은 페이지네이션이 적용된 PortMatch API를 사용한다. 준비물은 Docker Compose, k6, Python 3, OpenSSL이다.

## 로컬 DB와 앱 시작

최초 한 번 비밀번호 파일을 생성한다. 같은 볼륨을 사용하는 동안 이 값을 재사용한다.

```bash
cd experiment/load-test
if [ ! -f .env ]; then
  (umask 077
   printf 'POSTGRES_PASSWORD=%s\nRABBITMQ_PASSWORD=%s\nBENCH_PASSWORD=%s\nBENCH_ROWS=100000\n' \
     "$(openssl rand -hex 24)" "$(openssl rand -hex 24)" "$(openssl rand -hex 24)" > .env)
fi
docker compose up -d --build --wait
docker compose exec -T db psql -X -U portmatch -d portmatch \
  -c 'SELECT count(*) FROM job_postings'
curl -fsS http://127.0.0.1:8102/actuator/health/readiness
```

첫 기동에서 저장소의 DB 스키마와 채팅 마이그레이션이 적용된 뒤, 10만 건용 시드가 실행된다. 10만 건 DB의 초기값은 공고 100,000건, 기업 10,000곳, 합성 지원자 2,000명, 스크랩 10,000건, 공고–스택 연결 270,000건이다. 합성 지원자는 통계용이며 러너가 로그인 가능한 계정을 따로 준비한다. API 포트를 바꾸려면 `.env`에 `BACKEND_PORT`를 넣고 셸의 `BASE_URL`도 맞춘다.

`BENCH_ROWS=5000`은 소규모 시드다. 선택값은 빈 DB 볼륨의 최초 초기화에 적용된다. 10만 건 환경과 분리해 5천 건을 실행하려면 아래처럼 프로젝트명, 포트, 데이터셋을 고정한다.

```bash
export COMPOSE_PROJECT_NAME=portmatch-load-test-5k
export BENCH_ROWS=5000 BACKEND_PORT=8103 BASE_URL=http://127.0.0.1:8103
docker compose up -d --build --wait
```

## 화면 흐름 테스트

```bash
set -a
. ./.env
set +a
bash run-flow.sh
```

5천 건 프로젝트에서는 `.env`를 읽은 뒤 `BENCH_ROWS=5000 BACKEND_PORT=8103 BASE_URL=http://127.0.0.1:8103`을 다시 export한다. 러너는 실제 DB 행 수를 확인하고, 전용 계정 24개의 스크랩을 각 구간 직전에 5건으로 초기화한다. 첫 페이지와 단일 전체 흐름을 확인한 뒤 **6 → 12 → 24 → 48 흐름/분**, 각 3분을 측정한다. readiness 실패, 컨테이너 상태 변경, 흐름 성공률 90% 미만에서 증량을 중단한다.

한 iteration은 로그인된 지원자 한 명의 화면 흐름이다. 첫 20건 목록 → 공고 검색·기업 검색 병렬 요청 → 상세·스크랩 상태·스택·같은 기업 공고 순으로 실행한다. 약 30%는 스크랩 토글 후 저장 목록을 확인한다. 화면 전환 대기 2초는 흐름 시간 지표에서 뺀다. 브라우저 렌더링과 공통 채팅 요청은 범위 밖이다. JSON과 실행 로그는 `results/`에 생성된다.

## 기존 HTTP 요청률 테스트

5천 건 DB에서 기존의 목록·검색 API 읽기 부담을 다시 측정하려면 같은 디렉터리에서 아래처럼 실행한다. 화면 흐름 테스트와 다른 워크로드이며 iteration당 HTTP 요청 1건이다.

```bash
mkdir -p results
for rate in 5 10 20 40 80; do
  MODE=read RATE="$rate" DURATION=3m SUMMARY_FILE="results/read-$rate.json" \
    k6 run api-stress.js || break
done
```

각 단계의 k6 실패 원인을 확인한다. 특히 연결 지연, 요청 타임아웃, 누락 iteration을 성공 RPS 및 p95와 함께 기록한다. EC2 측정값과 로컬 자원 조건은 다르므로 이전 측정은 [결과 기록](RESULTS.md)을 참조한다. 실험을 마치면 같은 프로젝트 환경에서 `docker compose stop`으로 중지할 수 있다.

## 관련 문서

- [화면 흐름과 요청 순서](SCREEN-FLOW.md)
- [측정 요약](RESULTS.md)
- [상세 측정 기록](DETAILED-RESULTS.md)
