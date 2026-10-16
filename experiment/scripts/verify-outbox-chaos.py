#!/usr/bin/env python3
"""Run the current bootJar in an isolated two-backend chaos environment.
Requires Docker, Node, and an existing portmatch-chat-experiment:local Java 21 image.
Run Gradle test bootJar first. Only this run's containers/volume are removed.
"""
import copy
import gzip
import json
import os
from pathlib import Path
import subprocess
import tempfile
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
RUN = time.strftime('outbox-chaos-%Y%m%d-%H%M%S', time.gmtime())
PROJECT = 'portmatch-' + RUN
EVIDENCE = ROOT / 'evidence' / 'chat-outbox' / RUN
EVIDENCE.mkdir(parents=True)
JAR = ROOT.parent / 'Backend/build/libs/portmatch-backend-0.0.1-SNAPSHOT.jar'
if not JAR.is_file():
    raise SystemExit('Run Backend/gradlew -p Backend bootJar first')


def call(args, **kwargs):
    return subprocess.check_output(args, text=True, **kwargs)


def fetch(url):
    with urllib.request.urlopen(url, timeout=4) as r:
        return r.read().decode()


def ready():
    deadline = time.monotonic() + 120
    while time.monotonic() < deadline:
        try:
            if all(json.loads(fetch(f'http://localhost:{p}/actuator/health'))['status'] == 'UP'
                   for p in (28081, 28082)):
                return
        except Exception:
            pass
        time.sleep(2)
    raise RuntimeError('Both backends did not become healthy within 120 seconds')


base = json.loads(call(['docker', 'compose', '-f', str(ROOT / 'docker-compose.yml'), 'config', '--format', 'json']))
base['name'] = PROJECT
base.pop('x-backend', None)
for name, network in base.get('networks', {}).items():
    network['name'] = PROJECT + '_' + name
for name, volume in base.get('volumes', {}).items():
    volume['name'] = PROJECT + '_' + name
base['services'].pop('prometheus', None)
for name, service in base['services'].items():
    for port in service.get('ports', []):
        port['published'] = str(int(port['published']) + 10000)
        port['host_ip'] = '127.0.0.1'
    if name in ('backend1', 'backend2'):
        service.pop('build', None)
        service.setdefault('volumes', []).append({'type': 'bind', 'source': str(JAR), 'target': '/app/app.jar', 'read_only': True})
        service['environment'].update({'CHAT_PUBLISH_MODE': 'outbox', 'JPA_SHOW_SQL': 'false', 'HIBERNATE_FORMAT_SQL': 'false'})

# All scenarios use the same isolated database; run.mjs resets only this suite's data.
scenarios = [
    ('normal', 'normal', 'none', {}, 200, 50, 15),
    ('long-poll', 'normal', 'none', {'CHAT_OUTBOX_POLL_DELAY_MS': '3600000'}, 100, 25, 10),
    ('after-commit', 'db_commit', 'outbox-after-commit', {}, 100, 20, 30),
    ('after-confirm', 'outbox_after_confirm', 'outbox-after-confirm', {}, 100, 20, 70),
    ('mq-outage-saturation', 'rabbit_outage', 'none', {
        'CHAT_OUTBOX_EXECUTOR_THREADS': '1', 'CHAT_OUTBOX_EXECUTOR_QUEUE_CAPACITY': '2'}, 100, 20, 60),
    ('consumer-after-process', 'consumer_after_process', 'consumer-after-process', {}, 100, 20, 30),
]
results = []
with tempfile.TemporaryDirectory(prefix=RUN) as temp:
    compose = Path(temp) / 'compose.json'
    compose.write_text(json.dumps(base))
    dc = ['docker', 'compose', '-p', PROJECT, '-f', str(compose)]
    try:
        with (EVIDENCE / 'startup.log').open('w') as log:
            subprocess.run(dc + ['up', '-d', 'postgres', 'rabbitmq', 'redis', 'toxiproxy-init'], stdout=log, stderr=subprocess.STDOUT, check=True)
        for label, scenario, chaos, settings, count, rate, recovery in scenarios:
            print(f'START {label}', flush=True)
            config = copy.deepcopy(base)
            for name in ('backend1', 'backend2'):
                config['services'][name]['environment'].update(settings | {
                    'CHAT_CHAOS_POINT': chaos, 'CHAT_CHAOS_TRIGGER_SEQUENCE': '20'})
            compose.write_text(json.dumps(config))
            with (EVIDENCE / f'{label}-startup.log').open('w') as log:
                subprocess.run(dc + ['up', '-d', '--no-deps', '--force-recreate', 'backend1', 'backend2', 'nginx'],
                               stdout=log, stderr=subprocess.STDOUT, check=True)
            ready()
            run_id = RUN + '-' + label
            env = os.environ | {'COMPOSE_PROJECT_NAME': PROJECT, 'EXPERIMENT_COMPOSE_FILE': str(compose),
                'EXPERIMENT_BASE_URL': 'http://localhost:28080',
                'EXPERIMENT_RABBIT_URL': 'http://localhost:25672',
                'EXPERIMENT_TOXIPROXY_URL': 'http://localhost:28474',
                'CHAT_PUBLISH_MODE': 'outbox', 'CHAT_SCENARIO': scenario,
                'CHAT_MESSAGE_COUNT': str(count), 'CHAT_RATE': str(rate),
                'CHAT_CHAOS_TRIGGER_SEQUENCE': '20', 'CHAT_RECOVERY_SECONDS': str(recovery),
                'CHAT_OUTAGE_SECONDS': '15', 'CHAT_RUN_ID': run_id}
            events_file = EVIDENCE / f'{label}-events.jsonl'
            with events_file.open('w') as event_log:
                events = subprocess.Popen(['docker', 'events', '--filter', f'label=com.docker.compose.project={PROJECT}',
                    '--filter', 'event=die', '--format', '{{json .}}'], stdout=event_log, stderr=subprocess.DEVNULL)
                try:
                    with (EVIDENCE / f'{label}-run.log').open('w') as log:
                        subprocess.run(['node', str(ROOT / 'scripts/run.mjs')], env=env, stdout=log,
                                       stderr=subprocess.STDOUT, check=True, timeout=180)
                finally:
                    events.terminate()
                    events.wait(timeout=5)
            result = json.loads((ROOT / 'results' / run_id / 'raw-results.json').read_text())
            result['label'] = label
            result['settings'] = settings
            result['restartCounts'] = {}
            result['dispatchRejected'] = 0
            for name, port in [('backend1', 28081), ('backend2', 28082)]:
                cid = call(dc + ['ps', '-q', name]).strip()
                result['restartCounts'][name] = int(call(['docker', 'inspect', '-f', '{{.RestartCount}}', cid]))
                metrics = fetch(f'http://localhost:{port}/actuator/prometheus')
                (EVIDENCE / f'{label}-{name}-metrics.txt').write_text(metrics)
                for line in metrics.splitlines():
                    if line.startswith('chat_outbox_dispatch_rejected_total'):
                        result['dispatchRejected'] += float(line.split()[-1])
            result['halt137Count'] = sum(json.loads(line).get('Actor', {}).get('Attributes', {}).get('exitCode') == '137'
                                         for line in events_file.read_text().splitlines() if line)
            result['checks'] = {
                'committedMessagesProcessed': result['dbCommittedMessageCount'] == result['consumerProcessedUniqueCount'] > 0,
                'allOutboxPublished': result['publishedOutboxCount'] == result['dbCommittedMessageCount'],
                'allEventsObservedAtBroker': result['brokerDeliveredUniqueEventCount'] == result['dbCommittedMessageCount'],
                'noUnfinishedOutbox': result['pendingOutboxCount'] == result['processingOutboxCount'] == result['failedOutboxCount'] == 0,
            }
            if chaos != 'none':
                result['checks']['actualProcessHalt'] = result['halt137Count'] >= 1
                gate = f'chat:chaos:{chaos}:{run_id}'
                result['chaosGateTriggered'] = call(dc + ['exec', '-T', 'redis', 'redis-cli', 'exists', gate]).strip() == '1'
                result['checks']['chaosGateTriggered'] = result['chaosGateTriggered']
            else:
                result['checks']['allHttpSucceeded'] = result['httpSuccessCount'] == count
            if label == 'after-confirm':
                result['checks']['duplicatePublicationObserved'] = result['duplicatePublishCount'] >= 1
                result['checks']['leaseRecoveryObserved'] = result['outboxRetryCount'] >= 1
            if label == 'mq-outage-saturation':
                result['checks']['executorRejectionObserved'] = result['dispatchRejected'] > 0
            result['passed'] = all(result['checks'].values())
            results.append(result)
            (EVIDENCE / 'results.json').write_text(json.dumps(results, indent=2))
            with gzip.open(EVIDENCE / f'{label}-backend.log.gz', 'wt') as log:
                log.write(call(dc + ['logs', '--no-color', 'backend1', 'backend2'], stderr=subprocess.STDOUT))
            print(f"DONE {label}: passed={result['passed']}, committed={result['dbCommittedMessageCount']}, "
                  f"processed={result['consumerProcessedUniqueCount']}, duplicates={result['duplicatePublishCount']}, "
                  f"rejected={result['dispatchRejected']}, halted={result['halt137Count']}", flush=True)
            if label == 'normal':
                stomp_env = os.environ | {'EXPERIMENT_COMPANY_BASE_URL': 'http://localhost:28081',
                                         'EXPERIMENT_APPLICANT_BASE_URL': 'http://localhost:28082'}
                with (EVIDENCE / 'stomp-check.json').open('w') as log:
                    subprocess.run(['node', str(ROOT / 'scripts/stomp-check.mjs')], env=stomp_env,
                                   stdout=log, check=True, timeout=40)
            if not result['passed']:
                raise AssertionError(result['checks'])
    finally:
        with gzip.open(EVIDENCE / 'final-backend.log.gz', 'wt') as log:
            log.write(subprocess.run(dc + ['logs', '--no-color', 'backend1', 'backend2'], capture_output=True, text=True).stdout)
        subprocess.run(dc + ['down', '-v'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
print(f'PASS: {EVIDENCE}', flush=True)
