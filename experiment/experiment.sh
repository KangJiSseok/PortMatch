#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
COMPOSE=(docker compose -f "$ROOT/docker-compose.yml")
action="${1:-help}"
wait_ready() {
  for _ in {1..60}; do curl -sf http://localhost:18080/actuator/health >/dev/null && return; sleep 2; done
  "${COMPOSE[@]}" logs --tail=100 backend1 backend2
  return 1
}

case "$action" in
  up) "${COMPOSE[@]}" up -d --build ;;
  seed) wait_ready; CHAT_MESSAGE_COUNT=0 node "$ROOT/scripts/run.mjs" ;;
  run)
    export CHAT_PUBLISH_MODE="${2:-direct}" CHAT_SCENARIO="${3:-normal}"
    case "$CHAT_SCENARIO" in
      db_commit) export CHAT_CHAOS_POINT="${CHAT_PUBLISH_MODE}-after-commit" ;;
      outbox_after_confirm) export CHAT_CHAOS_POINT=outbox-after-confirm ;;
      consumer_after_process) export CHAT_CHAOS_POINT=consumer-after-process ;;
      *) export CHAT_CHAOS_POINT=none ;;
    esac
    export CHAT_CHAOS_TRIGGER_SEQUENCE="${CHAT_CHAOS_TRIGGER_SEQUENCE:-100}"
    "${COMPOSE[@]}" up -d --force-recreate backend1 backend2 nginx
    wait_ready
    node "$ROOT/scripts/run.mjs"
    ;;
  matrix)
    scenarios=(normal db_commit rabbit_outage outbox_after_confirm consumer_after_process permanent_failure)
    modes=(direct outbox outbox direct direct outbox outbox direct direct outbox)
    for scenario in "${scenarios[@]}"; do
      for mode in "${modes[@]}"; do "$0" run "$mode" "$scenario"; done
    done
    ;;
  resume)
    scenarios=(normal db_commit rabbit_outage outbox_after_confirm consumer_after_process permanent_failure)
    modes=(direct outbox)
    for scenario in "${scenarios[@]}"; do
      for mode in "${modes[@]}"; do
        completed=$(node -e 'const fs=require("fs"),p=require("path");let n=0;for(const d of fs.readdirSync(process.argv[1])){try{const r=JSON.parse(fs.readFileSync(p.join(process.argv[1],d,"raw-results.json")));if(r.scenario===process.argv[2]&&r.mode===process.argv[3])n++}catch{}}console.log(n)' "$ROOT/results" "$scenario" "$mode")
        while (( completed < 5 )); do "$0" run "$mode" "$scenario"; ((completed+=1)); done
      done
    done
    ;;
  stomp-check) wait_ready; node "$ROOT/scripts/stomp-check.mjs" ;;
  report) node "$ROOT/scripts/report.mjs" ;;
  down) "${COMPOSE[@]}" down ;;
  reset) "${COMPOSE[@]}" down -v ;;
  *) echo "usage: $0 {up|seed|run MODE SCENARIO|matrix|resume|stomp-check|report|down|reset}" ;;
esac
