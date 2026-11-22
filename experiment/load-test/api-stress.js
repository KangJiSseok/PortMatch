import http from 'k6/http';
import exec from 'k6/execution';
import { check, fail } from 'k6';
import { Counter } from 'k6/metrics';

const base = __ENV.BASE_URL || 'http://127.0.0.1:8102';
const mode = __ENV.MODE || 'read';
const rate = Number(__ENV.RATE || 5);
const duration = __ENV.DURATION || '3m';
const email = __ENV.BENCH_EMAIL || 'baseline-applicant@example.com';
const password = __ENV.BENCH_PASSWORD;
const headers = { 'Content-Type': 'application/json' };
const successes = new Counter('successful_requests');

function arrival(fn, amount) {
  const budget = { 2: 4, 5: 8, 10: 12, 20: 20, 40: 32, 80: 64 }[rate] || 4;
  const writeVUs = Math.max(2, Math.ceil(budget / 10));
  const fixedVUs = mode === 'mixed' ? (fn === 'write' ? writeVUs : budget - writeVUs) : budget;
  return {
    executor: 'constant-arrival-rate', exec: fn, rate: amount, timeUnit: '10s',
    duration, preAllocatedVUs: fixedVUs, maxVUs: fixedVUs, gracefulStop: '10s',
  };
}

if (!['read', 'mixed', 'smoke', 'views', 'recovery'].includes(mode)) {
  throw new Error('Unknown MODE');
}
if (!Number.isSafeInteger(rate) || rate < 1 || rate > 80) {
  throw new Error('RATE must be an integer from 1 through 80');
}

let scenarios = { read: arrival('read', rate * 10) };
if (mode === 'mixed') {
  scenarios = { read: arrival('read', rate * 9), write: arrival('write', rate) };
}
if (mode === 'views') {
  scenarios = { views: { executor: 'shared-iterations', exec: 'view', vus: 20, iterations: 1000, maxDuration: '3m' } };
}
if (mode === 'smoke') {
  scenarios = { smoke: { executor: 'shared-iterations', exec: 'smoke', vus: 1, iterations: 1 } };
}
if (mode === 'recovery') scenarios = { recovery: arrival('read', 10) };

const thresholds = mode === 'recovery' ? {} : {
  checks: ['rate>0.99'], http_req_failed: ['rate<0.01'], dropped_iterations: ['count==0'],
  ...(mode === 'read' || mode === 'mixed' ? { 'http_req_duration{bench:yes}': ['p(95)<=500'] } : {}),
};
if (mode === 'read' || mode === 'mixed') {
  thresholds['http_req_duration{operation:search}'] = ['p(95)<=500'];
  thresholds['http_req_duration{operation:latest}'] = ['p(95)<=500'];
}
if (mode === 'mixed') {
  thresholds['http_req_duration{operation:scrap}'] = ['p(95)<=500'];
  thresholds['successful_requests{operation:scrap}'] = ['count>0'];
}
if (mode === 'smoke') thresholds.checks = ['rate==1'];
export const options = {
  scenarios, thresholds, summaryTrendStats: ['min', 'med', 'p(95)', 'p(99)', 'max'],
  discardResponseBodies: false,
};

function valid(response, predicate, measured = true, operation = 'request') {
  let body;
  try { body = response.json(); } catch (_) { body = null; }
  const passed = check(response, {
    'expected HTTP status and response': (res) =>
      res.status === 200 && body?.status === true && predicate(body.data),
  }, { operation });
  if (passed && measured) successes.add(1, { operation });
  return passed;
}

export function setup() {
  if (!['mixed', 'smoke'].includes(mode)) return {};
  if (!password) fail('Set BENCH_PASSWORD');
  const login = () => http.post(
    base + '/api/auth/login', JSON.stringify({ email, password, expectedRole: 'APPLICANT' }),
    { headers, responseCallback: http.expectedStatuses(200, 400, 401, 403, 404) },
  );
  if (mode === 'smoke') {
    http.post(base + '/api/accounts/signup/applicant', JSON.stringify({
      email, password, name: 'Baseline Applicant', phone: '01000009999',
      totalExperienceYears: 0,
    }), { headers, responseCallback: http.expectedStatuses(200, 201, 400, 409) });
  }
  const response = login();
  if (!valid(response, (data) => Number.isSafeInteger(data?.userId), false)) fail('Baseline account login failed');
  const cookie = Object.entries(http.cookieJar().cookiesForURL(base + '/api/auth/me'))
    .map(([name, values]) => name + '=' + values[0]).join('; ');
  if (!cookie) fail('Login returned no usable session cookie');
  return { uid: response.json('data.userId'), cookie };
}

function measured(operation, extraHeaders = {}) {
  return { headers: extraHeaders, tags: { bench: 'yes', operation }, timeout: '5s' };
}

export function read() {
  const index = exec.scenario.iterationInTest;
  if (index % 2 === 0) {
    const page = Math.floor(index / 2) % 20;
    valid(http.get(base + '/api/job-postings/latest?size=10&page=' + page, measured('latest')),
      (data) => Array.isArray(data) && data.length === 10);
  } else {
    const keyword = 'Baseline team ' + String(Math.floor(index / 2) % 100).padStart(3, '0');
    valid(http.get(base + '/api/job-postings/search?keyword=' + encodeURIComponent(keyword), measured('search')),
      (data) => Array.isArray(data) && data.length === 50);
  }
}

export function write(data) {
  const id = exec.scenario.iterationInTest + 2;
  if (id > 4999) fail('Write fixture range exhausted');
  valid(http.post(base + '/api/scraps?uid=' + data.uid + '&pid=' + id, null,
    measured('scrap', { Cookie: data.cookie })), (value) => value === true, true, 'scrap');
}

export function view() {
  valid(http.get(base + '/api/job-postings/5000', measured('detail')), (data) => data?.id === 5000);
}

export function smoke(data) {
  read();
  view();
  const params = { headers: { Cookie: data.cookie } };
  valid(http.get(base + '/api/auth/me', params), (value) => value != null);
  const query = '?uid=' + data.uid + '&pid=1';
  const state = () => http.get(base + '/api/scraps/check' + query, params);
  const toggle = () => http.post(base + '/api/scraps' + query, null, params);
  if (!valid(state(), (value) => value === false)) fail('Reset the smoke-test scrap before retrying');
  valid(toggle(), (value) => value === true);
  valid(state(), (value) => value === true);
  valid(toggle(), (value) => value === false);
  valid(state(), (value) => value === false);
}

export function handleSummary(data) {
  const metric = (name) => data.metrics[name]?.values || {};
  const seconds = data.state.testRunDurationMs / 1000;
  const successful = metric('successful_requests').count || 0;
  return {
    stdout: JSON.stringify({
      mode, rate, successful, approximateSuccessRps: successful / seconds,
      successfulScraps: metric('successful_requests{operation:scrap}').count,
      latencyMs: metric('http_req_duration{bench:yes}'),
      httpFailureRate: metric('http_req_failed').rate,
      validationPassRate: metric('checks').rate,
      dropped: metric('dropped_iterations').count || 0,
    }, null, 2) + '\n',
    [__ENV.SUMMARY_FILE || 'summary.json']: JSON.stringify(data, null, 2),
  };
}
