#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
export BASE_URL="${BASE_URL:-http://127.0.0.1:8102}"
export BENCH_PASSWORD="${BENCH_PASSWORD:?source the benchmark .env}"
output="${1:-results/flow-$(date -u +%Y%m%dT%H%M%SZ)}"
mkdir -p "$output"

health() { curl -fsS --max-time 5 "$BASE_URL/actuator/health/readiness" | grep -q '"UP"'; }
db() { docker compose exec -T db psql -X -v ON_ERROR_STOP=1 -U portmatch -d portmatch "$@"; }
fixtures() { db < sql/reset-scraps.sql; }
state() {
  docker inspect --format '{{.Id}} {{.State.StartedAt}} {{.State.OOMKilled}} {{.RestartCount}}' \
    "$(docker compose ps -aq backend)"
}

for attempt in {1..60}; do
  if health 2>/dev/null; then break; fi
  sleep 2
done
health
rows="$(db -Atc 'SELECT count(*) FROM job_postings')"
[[ $rows == 5000 || $rows == 100000 ]]
python3 prepare-accounts.py
fixtures
curl -fsS --max-time 10 -o "$output/first-page.json" \
  -w 'HTTP %{http_code} bytes=%{size_download} seconds=%{time_total}\n' \
  "$BASE_URL/api/job-postings?page=0" | tee "$output/first-page.log"

run_step() {
  local label=$1 rate=$2 probe=$3 status=0
  printf '%s ROWS=%s PROBE=%s FLOWS_PER_MINUTE=%s k6 run flow.js\n' \
    "$(date -u +'%FT%TZ')" "$rows" "$probe" "$rate" | tee -a "$output/commands.log"
  state > "$output/$label.before" || return 1
  ROWS="$rows" FLOWS_PER_MINUTE="$rate" PROBE="$probe" DURATION=3m SUMMARY_FILE="$output/$label.json" \
    k6 run --quiet flow.js > "$output/$label.log" 2>&1 || status=$?
  state > "$output/$label.after" || return 1
  if ! cmp -s "$output/$label.before" "$output/$label.after" || grep -q ' true ' "$output/$label.after"; then
    echo "$label: unexpected backend state change or OOM" >&2
    return 1
  fi
  health || return 1
  printf '%s exit=%s\n' "$label" "$status" | tee -a "$output/commands.log"
  return "$status"
}

run_step probe 1 1
for rate in 6 12 24 48; do
  fixtures
  run_step "$rate-flows-per-minute" "$rate" 0
done
