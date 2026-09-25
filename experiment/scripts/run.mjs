import { execFileSync } from 'node:child_process';
import { mkdir, writeFile, appendFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const compose = resolve(root, 'docker-compose.yml');
const base = process.env.EXPERIMENT_BASE_URL || 'http://localhost:18080';
const rabbit = 'http://localhost:15672';
const mode = process.env.CHAT_PUBLISH_MODE || 'direct';
const scenario = process.env.CHAT_SCENARIO || 'normal';
const count = Number(process.env.CHAT_MESSAGE_COUNT || 10000);
const rate = Number(process.env.CHAT_RATE || 50);
const recoverySeconds = Number(process.env.CHAT_RECOVERY_SECONDS || 60);
const maxInFlight = Number(process.env.CHAT_MAX_IN_FLIGHT || 100);
const scaleNote = process.env.CHAT_SCALE_NOTE || null;
const triggerSequence = Number(process.env.CHAT_CHAOS_TRIGGER_SEQUENCE || 100);
const outageSeconds = Number(process.env.CHAT_OUTAGE_SECONDS || 30);
const runId = process.env.CHAT_RUN_ID || `${new Date().toISOString().replaceAll(/[:.]/g, '-')}-${mode}-${scenario}`;
const resultDir = resolve(root, 'results', runId);

const dc = (...args) => execFileSync('docker', ['compose', '-f', compose, ...args], { encoding: 'utf8' }).trim();
const sql = (query) => dc('exec', '-T', 'postgres', 'psql', '-U', 'portmatch', '-d', 'portmatch', '-Atc', query);
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
const auth = { Authorization: `Basic ${Buffer.from('portmatch:portmatch').toString('base64')}` };

async function json(url, options = {}) {
  const response = await fetch(url, options);
  const body = await response.text();
  if (!response.ok) throw new Error(`${response.status} ${url}: ${body}`);
  return body ? JSON.parse(body) : null;
}

async function signupAndLogin() {
  const users = [
    ['/api/accounts/signup/applicant', { name: 'Experiment Applicant', email: 'chat-applicant@experiment.local', password: 'Password1', phone: '010-1111-1111' }, 'APPLICANT'],
    ['/api/accounts/signup/company', { email: 'chat-company@experiment.local', password: 'Password1', managerName: 'Experiment Company', managerPhone: '010-2222-2222', companyName: 'Experiment Company', businessNumber: '123-45-67890', address: 'experiment' }, 'COMPANY'],
  ];
  const sessions = [];
  for (const [path, payload, role] of users) {
    await fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    const login = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: payload.email, password: payload.password, expectedRole: role }) });
    if (!login.ok) throw new Error(`login failed: ${await login.text()}`);
    const cookie = login.headers.get('set-cookie')?.split(';')[0];
    const me = await json(base + '/api/auth/me', { headers: { cookie } });
    sessions.push({ cookie, id: me.data.userId });
  }
  return { applicant: sessions[0], company: sessions[1] };
}

async function purge() {
  sql('truncate chat_consumer_attempt,chat_consumed_event,chat_outbox,chat_message,chat_room_member,chat_room_sequence,chat_room,chat_system_alert restart identity cascade');
  for (const queue of ['chat.message.created.q', 'chat.message.created.retry.q', 'chat.message.created.dlq', 'chat.experiment.observer.q']) {
    await fetch(`${rabbit}/api/queues/%2F/${encodeURIComponent(queue)}/contents`, { method: 'DELETE', headers: auth });
  }
}

async function toxic(enabled) {
  for (const proxy of ['rabbit-amqp', 'rabbit-stomp']) {
    const url = `http://localhost:18474/proxies/${proxy}/toxics/outage`;
    if (enabled) await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'timeout', stream: 'downstream', toxicity: 1, attributes: { timeout: outageSeconds * 1000 } }) });
    else await fetch(url, { method: 'DELETE' });
  }
}

const percentile = (values, p) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];
};

function containerStats() {
  const ids = ['backend1', 'backend2'].map((service) => dc('ps', '-q', service));
  return execFileSync('docker', ['stats', '--no-stream', '--format', '{{json .}}', ...ids], { encoding: 'utf8' })
    .trim().split('\n').filter(Boolean).map(JSON.parse).map((row) => ({ name: row.Name, cpu: row.CPUPerc, memory: row.MemUsage }));
}

async function observerEvents() {
  const rows = await json(`${rabbit}/api/queues/%2F/chat.experiment.observer.q/get`, { method: 'POST',
    headers: { ...auth, 'content-type': 'application/json' },
    body: JSON.stringify({ count: Math.max(count * 3, 100), ackmode: 'ack_requeue_true', encoding: 'auto', truncate: 100000 }) });
  return rows.map((row) => JSON.parse(row.payload));
}

async function run() {
  await mkdir(resultDir, { recursive: true });
  const startedAt = new Date();
  const { applicant, company } = await signupAndLogin();
  await purge();
  const room = await json(base + '/api/chat/rooms', { method: 'POST', headers: { cookie: company.cookie, 'content-type': 'application/json' },
    body: JSON.stringify({ targetUserId: applicant.id }) });
  const roomId = room.data.id;
  const latencies = [];
  let httpSuccessCount = 0;
  let httpFailureCount = 0;
  const httpStatusCounts = {};
  let outageStartedAt = null;
  let outageRecoveredAt = null;
  const interval = 1000 / rate;
  const sendStartedAt = new Date();
  const sends = [];
  const pending = new Set();
  for (let i = 1; i <= count; i++) {
    const target = sendStartedAt.getTime() + (i - 1) * interval;
    if (Date.now() < target) await sleep(target - Date.now());
    if (scenario === 'rabbit_outage' && i === triggerSequence) {
      outageStartedAt = new Date(); await toxic(true);
      setTimeout(() => { void toxic(false).then(() => { outageRecoveredAt = new Date(); }); }, outageSeconds * 1000);
    }
    const content = scenario === 'permanent_failure' && i === triggerSequence ? '__CHAOS_PERMANENT_FAILURE__' : `message-${i}`;
    const send = (async () => {
      const before = performance.now();
      try {
      const response = await fetch(`${base}/api/chat/rooms/${roomId}/messages`, { method: 'POST',
        headers: { cookie: company.cookie, 'content-type': 'application/json' },
        body: JSON.stringify({ clientMessageId: crypto.randomUUID(), content, messageType: 'TEXT', testRunId: runId }) });
        httpStatusCounts[response.status] = (httpStatusCounts[response.status] || 0) + 1;
        response.ok ? httpSuccessCount++ : httpFailureCount++;
      } catch { httpFailureCount++; }
      latencies.push(performance.now() - before);
    })();
    sends.push(send); pending.add(send); send.finally(() => pending.delete(send));
    if (pending.size >= maxInFlight) await Promise.race(pending);
  }
  await Promise.all(sends);
  const sendFinishedAt = new Date();
  await sleep(recoverySeconds * 1000);
  await toxic(false);
  const dbCommittedMessageCount = Number(sql(`select count(*) from chat_message where test_run_id='${runId}'`));
  const consumerProcessedUniqueCount = Number(sql(`select count(*) from chat_consumed_event where test_run_id='${runId}'`));
  const consumerAttemptCount = Number(sql(`select count(*) from chat_consumer_attempt where test_run_id='${runId}'`));
  const duplicateConsumeCount = Number(sql(`select greatest(count(*) - count(distinct a.event_id),0) from chat_consumer_attempt a join chat_consumed_event c on c.event_id=a.event_id where a.test_run_id='${runId}'`));
  const e2e = sql(`select coalesce(percentile_cont(0.5) within group(order by extract(epoch from (c.processed_at-m.created_at))*1000),0),coalesce(percentile_cont(0.95) within group(order by extract(epoch from (c.processed_at-m.created_at))*1000),0),coalesce(percentile_cont(0.99) within group(order by extract(epoch from (c.processed_at-m.created_at))*1000),0) from chat_consumed_event c join chat_message m on m.id=c.message_id where c.test_run_id='${runId}'`).split('|').map(Number);
  const outbox = sql(`select count(*) filter(where status='PENDING'),count(*) filter(where status='PUBLISHED'),count(*) filter(where status='FAILED') from chat_outbox where payload->>'testRunId'='${runId}'`).split('|').map(Number);
  const events = await observerEvents();
  const uniqueEvents = new Set(events.filter((e) => e.testRunId === runId).map((e) => e.eventId));
  const brokerEvents = events.filter((e) => e.testRunId === runId).length;
  const dlq = await json(`${rabbit}/api/queues/%2F/chat.message.created.dlq`, { headers: auth });
  const finishedAt = new Date();
  const result = {
    runId, mode, scenario, seed: 20260923, configuredMessageCount: count, configuredRate: rate,
    maxInFlight, scaleNote,
    startedAt, finishedAt, attemptedRequestCount: count, httpSuccessCount, httpFailureCount, httpStatusCounts,
    dbCommittedMessageCount, brokerDeliveredEventCount: brokerEvents,
    brokerDeliveredUniqueEventCount: uniqueEvents.size, consumerAttemptCount, consumerProcessedUniqueCount,
    duplicatePublishCount: Math.max(0, brokerEvents - uniqueEvents.size),
    duplicateConsumeCount,
    lostMessageCount: Math.max(0, dbCommittedMessageCount - consumerProcessedUniqueCount),
    deliverySuccessRate: dbCommittedMessageCount ? consumerProcessedUniqueCount / dbCommittedMessageCount * 100 : 0,
    lostRate: dbCommittedMessageCount ? (dbCommittedMessageCount - consumerProcessedUniqueCount) / dbCommittedMessageCount * 100 : 0,
    retryCount: Math.max(0, consumerAttemptCount - uniqueEvents.size), dlqCount: dlq.messages,
    pendingOutboxCount: outbox[0], publishedOutboxCount: outbox[1], failedOutboxCount: outbox[2],
    recoveryLatencyMs: outageRecoveredAt ? Math.max(0, new Date(sql(`select coalesce(max(processed_at),now()) from chat_consumed_event where test_run_id='${runId}'`)) - outageRecoveredAt) : null,
    endToEndLatencyMs: { p50: e2e[0], p95: e2e[1], p99: e2e[2] },
    apiLatencyMs: { p50: percentile(latencies, 50), p95: percentile(latencies, 95), p99: percentile(latencies, 99) },
    sendDurationSeconds: (sendFinishedAt - sendStartedAt) / 1000,
    throughput: count / ((sendFinishedAt - sendStartedAt) / 1000),
    containerStats: containerStats(),
  };
  await writeFile(resolve(resultDir, 'raw-results.json'), JSON.stringify(result, null, 2));
  const csv = (value) => `"${String(typeof value === 'object' ? JSON.stringify(value) : value).replaceAll('"', '""')}"`;
  await writeFile(resolve(resultDir, 'summary.csv'), `${Object.keys(result).map(csv).join(',')}\n${Object.values(result).map(csv).join(',')}\n`);
  await writeFile(resolve(resultDir, 'report.md'), `# ${runId}\n\n- mode: ${mode}\n- scenario: ${scenario}\n- committed: ${dbCommittedMessageCount}\n- processed unique: ${consumerProcessedUniqueCount}\n- delivery success: ${result.deliverySuccessRate.toFixed(4)}%\n- lost: ${result.lostMessageCount} (${result.lostRate.toFixed(4)}%)\n- duplicate publish: ${result.duplicatePublishCount}\n- duplicate consume: ${result.duplicateConsumeCount}\n- DLQ: ${result.dlqCount}\n- API p50/p95/p99: ${result.apiLatencyMs.p50}/${result.apiLatencyMs.p95}/${result.apiLatencyMs.p99} ms\n`);
  console.log(JSON.stringify(result, null, 2));
}

await run();
