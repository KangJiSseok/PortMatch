import http from 'k6/http';
import exec from 'k6/execution';
import { sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

const base = __ENV.BASE_URL || 'http://127.0.0.1:8102';
const rows = Number(__ENV.ROWS || 5000);
const rate = Number(__ENV.FLOWS_PER_MINUTE || 6);
const duration = __ENV.DURATION || '3m';
const probe = __ENV.PROBE === '1';
const httpOK = new Counter('validated_http');
const completed = new Counter('completed_flows');
const flowOK = new Rate('flow_success');
const screenTime = new Trend('screen_ms', true);
const flowTime = new Trend('flow_ms', true);
const listingBytes = new Trend('listing_bytes');
const validationErrors = new Counter('validation_errors');
const timeouts = new Counter('request_timeouts');

const endpoints = ['all_jobs','list_stacks','search_jobs','company_search','search_stacks','job_detail','scrap_check',
  'posting_stacks','company_jobs','detail_stack_names','scrap_toggle','auth_me','my_scraps','scrapped_job_details'];
const screens = ['list','search','detail','toggle','mypage_scraps'];
const summaryMetrics = Object.fromEntries([
  ...endpoints.map(step => ['http_req_duration{step:'+step+'}', ['p(95)>=0']]),
  ...screens.map(screen => ['screen_ms{screen:'+screen+'}', ['p(95)>=0']]),
]);
export const options = {
  batch: 64, batchPerHost: 64,
  scenarios: { flow: probe
    ? { executor: 'shared-iterations', vus: 1, iterations: 1, maxDuration: '90s' }
    : { executor: 'constant-arrival-rate', rate, timeUnit: '1m', duration,
        preAllocatedVUs: 24, maxVUs: 24, gracefulStop: '30s' } },
  thresholds: { ...summaryMetrics, flow_success: [probe ? 'rate==1' : 'rate>=0.90'] },
  summaryTrendStats: ['min', 'med', 'p(95)', 'p(99)', 'max'],
};

function parse(response, step) {
  if (response.error_code === 1050) timeouts.add(1, { step });
  if (response.status !== 200) throw new Error(step + ': HTTP ' + response.status + ' ' + (response.error || ''));
  const body = response.json();
  if (body.status !== true || body.code !== 1000) throw new Error(step + ': API code ' + body.code);
  httpOK.add(1, { step });
  return body.data;
}
function request(path, step, cookie, method = 'GET') {
  const headers = cookie ? { Cookie: cookie } : {};
  return parse(http.request(method, base + path, null, { headers, timeout: '10s', tags: { step, name: step } }), step);
}
function parallel(paths, step, cookie) {
  const headers = cookie ? { Cookie: cookie } : {};
  const responses = http.batch(paths.map(path => ({
    method: 'GET', url: base + path, params: { headers, timeout: '10s', tags: { step, name: step } },
  })));
  return parseBatch(responses, responses.map(() => step));
}
function parseBatch(responses, steps) {
  let failure;
  const bodies = responses.map((response, index) => {
    try { return parse(response, steps[index]); } catch (error) { failure = failure || error; return null; }
  });
  if (failure) throw failure;
  return bodies;
}
function must(value, message) {
  if (!value) throw new Error(message);
}
function utf8Bytes(text) {
  let size=0;
  for (const char of text) {
    const point=char.codePointAt(0);
    size += point<128 ? 1 : point<2048 ? 2 : point<65536 ? 3 : 4;
  }
  return size;
}
function unique(values) { return [...new Set(values.filter(id => Number.isSafeInteger(id) && id > 0))]; }
function names(ids, step, cookie) {
  return parallel(unique(ids).map(id => '/api/stacks/' + id), step, cookie);
}
function absentStackPaths(items, seen) {
  return items.filter(job => !job.stackIds?.length && !seen.has(job.id)).map(job => {
    seen.add(job.id);
    return '/api/stacks/posting/' + job.id;
  });
}
function screen(name, fn) {
  const now = Date.now();
  try { return fn(); } finally { screenTime.add(Date.now() - now, { screen: name }); }
}

export function setup() {
  if (!__ENV.BENCH_PASSWORD) throw new Error('Set BENCH_PASSWORD');
  const accounts = [];
  for (let n=1; n <= (probe ? 1 : 24); n++) {
    const jar = new http.CookieJar();
    const response = http.post(base + '/api/auth/login', JSON.stringify({
      email: 'flow-k6-' + n + '@example.com', password: __ENV.BENCH_PASSWORD, expectedRole: 'APPLICANT',
    }), { jar, headers: {'Content-Type':'application/json'}, timeout:'10s', tags: {phase:'setup'} });
    const body = response.json();
    if (response.status !== 200 || body.status !== true || !body.data?.userId) {
      throw new Error('Login failed for fixture account ' + n);
    }
    const cookie = Object.entries(jar.cookiesForURL(base + '/api/auth/me'))
      .map(([key, values]) => key + '=' + values[0]).join('; ');
    if (!cookie) throw new Error('Missing session cookie');
    accounts.push({uid:body.data.userId, cookie});
  }
  return accounts;
}

export default function (accounts) {
  const {uid, cookie} = accounts[exec.vu.idInTest - 1];
  const index = exec.scenario.iterationInTest;
  const started = Date.now();
  let think = 0;
  const pause = () => { const t=Date.now(); sleep(2); think+=Date.now()-t; };
  try {
    const seen = new Set();
    const stackNames = new Set();
    const listQuery = '/api/job-postings?page=0&cid=&sort=latest&deadline=all&experience=all&keyword=';
    function fetchPage(path, step) {
      const response=http.get(base+path, {
        headers:{Cookie:cookie}, timeout:'10s', tags:{step,name:step},
      });
      if (step==='all_jobs' && response.body) listingBytes.add(utf8Bytes(response.body));
      return parse(response,step);
    }
    function hydrate(items, step) {
      const ids=unique(items.flatMap(item=>item.stackIds||[])).filter(id=>!stackNames.has(id));
      ids.forEach(id=>stackNames.add(id));
      parallel([...ids.map(id=>'/api/stacks/'+id), ...absentStackPaths(items,seen)],step,cookie);
    }
    screen('list', () => {
      const page=fetchPage(listQuery,'all_jobs');
      must(Array.isArray(page.content) && page.content.length===20 && page.totalElements===rows,'Unexpected first page');
      hydrate(page.content,'list_stacks');
    });
    pause();
    const job=screen('search', () => {
      const key=rows===100000 ? String((42+index*13)%2000).padStart(4,'0')
        : 'Baseline team ' + String((42+index*13)%100).padStart(3,'0');
      const encoded=encodeURIComponent(key);
      const headers={Cookie:cookie};
      const responses=http.batch([
        {method:'GET',url:base+listQuery+encoded,params:{headers,timeout:'10s',tags:{step:'search_jobs',name:'search_jobs'}}},
        {method:'GET',url:base+'/api/companies/search?keyword='+encoded,params:{headers,timeout:'10s',tags:{step:'company_search',name:'company_search'}}},
      ]);
      const [page]=parseBatch(responses, ['search_jobs', 'company_search']);
      const matches=page.content;
      must(Array.isArray(matches) && matches.length>0 && matches.length<=20 &&
        matches.every(item=>item.title?.toLowerCase().includes(key.toLowerCase()) || item.company?.corpName?.includes(key)),
        'Unexpected server search result');
      hydrate(matches,'search_stacks');
      return matches[index%matches.length];
    });
    pause();
    const query='?uid='+uid+'&pid='+job.id;
    const previous=screen('detail', () => {
      const detail=request('/api/job-postings/'+job.id,'job_detail',cookie);
      must(detail.id===job.id,'Detail ID mismatch');
      const state=request('/api/scraps/check'+query,'scrap_check',cookie);
      must(typeof state==='boolean','Unexpected scrap state');
      request('/api/stacks/posting/'+job.id,'posting_stacks',cookie);
      const cid=detail.company?.cid || detail.cid;
      if (cid) {
        const sameCompany=request('/api/job-postings/company/'+encodeURIComponent(cid),'company_jobs',cookie);
        names(sameCompany.filter(item=>item.id!==job.id).flatMap(item=>item.stackIds||[]),'detail_stack_names',cookie);
      }
      return state;
    });
    if (probe || index%10<3) {
      pause();
      const state=screen('toggle',()=> request('/api/scraps'+query,'scrap_toggle',cookie,'POST'));
      must(state===!previous,'Scrap toggle did not change state');
      pause();
      screen('mypage_scraps',()=> {
        const me=request('/api/auth/me','auth_me',cookie);
        must(me.userId===uid,'Session account mismatch');
        const scraps=request('/api/scraps/'+uid,'my_scraps',cookie);
        must(scraps.some(item=>Number(item.pid)===job.id)===state,'Persisted scrap state mismatch');
        parallel(scraps.map(item=>'/api/job-postings/'+item.pid),'scrapped_job_details',cookie);
      });
    }
    flowOK.add(true);
    completed.add(1);
  } catch (error) {
    flowOK.add(false);
    validationErrors.add(1);
    console.warn(String(error));
  } finally {
    flowTime.add(Date.now()-started-think);
  }
}

export function handleSummary(data) {
  return { [__ENV.SUMMARY_FILE || 'flow-summary.json']: JSON.stringify(data, null, 2) };
}
