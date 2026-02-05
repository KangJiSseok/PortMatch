// src/api/myPage.ts
import { fetchInterviewRowsForMe, type InterviewApiRow } from './interview/user';

export type UserRole = 'APPLICANT' | 'COMPANY';

export type UserRow = {
  id: number;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
};

export type ApplicantRow = {
  id: number;
  user_id: number;
  birth_date?: string;
  gender?: string;
  total_experience_years?: number;
};

export type CompanyRow = {
  id: number;
  user_id: number;
  companies_name: string;
  address?: string;
  size?: string;
  homepage_url?: string;
};

export type JobPostStatus = 'OPEN' | 'CLOSED';
export type JobPostRow = {
  id: number;
  company_id: number;
  title: string;
  required_stacks?: string[];
  deadline?: string;
  status: JobPostStatus;
  created_at: string;
};

export type ResumeRow = {
  id: number;
  applicant_id: number;
  title: string;
  file_url?: string;
  created_at: string;
};

export type ApplicationStatus = 'APPLIED' | 'INTERVIEW_SCHEDULED' | 'REJECTED' | 'HIRED';
export type ApplicationRow = {
  id: number;
  job_post_id: number;
  applicant_id: number;
  resume_id: number;
  status: ApplicationStatus;
  applied_at: string;
};

export type InterviewStatus = 'SCHEDULED' | 'DONE' | 'CANCELLED';
export type InterviewRow = {
  id: number;
  application_id: number;
  room_id: string;
  scheduled_at: string;
  status: InterviewStatus;
};

export type ScrapRow = {
  id: number;
  applicant_id: number;
  job_post_id: number;
  created_at: string;
};

export const CURRENT_USER_ID = 1;
export const CURRENT_APPLICANT_ID = 1;

export const USERS: UserRow[] = [
  {
    id: 1,
    username: 'applicant_1',
    name: 'Applicant',
    email: 'applicant1@example.com',
    role: 'APPLICANT',
    created_at: '2026-01-01T09:00:00',
  },
  {
    id: 2,
    username: 'company_user_1',
    name: 'Company User 1',
    email: 'company1@example.com',
    role: 'COMPANY',
    created_at: '2026-01-01T09:00:00',
  },
  {
    id: 3,
    username: 'company_user_2',
    name: 'Company User 2',
    email: 'company2@example.com',
    role: 'COMPANY',
    created_at: '2026-01-01T09:00:00',
  },
];

export const APPLICANTS: ApplicantRow[] = [
  {
    id: 1,
    user_id: 1,
    birth_date: '2000-01-01',
    gender: 'N/A',
    total_experience_years: 0,
  },
];

export const COMPANIES: CompanyRow[] = [
  {
    id: 10,
    user_id: 2,
    companies_name: 'PortMatch',
    address: 'Seoul',
    size: 'SME',
    homepage_url: 'https://example.com/portmatch',
  },
  {
    id: 11,
    user_id: 3,
    companies_name: 'Acme Corp',
    address: 'Seoul',
    size: 'Enterprise',
    homepage_url: 'https://example.com/acme',
  },
];

export const JOB_POSTS: JobPostRow[] = [
  {
    id: 1001,
    company_id: 10,
    title: 'Frontend Intern',
    required_stacks: ['React', 'TypeScript'],
    deadline: '2026-02-01',
    status: 'OPEN',
    created_at: '2026-01-02T10:00:00',
  },
  {
    id: 1002,
    company_id: 11,
    title: 'Web Developer',
    required_stacks: ['React', 'Spring'],
    deadline: '2026-02-10',
    status: 'OPEN',
    created_at: '2026-01-03T10:00:00',
  },
  {
    id: 1003,
    company_id: 10,
    title: 'Backend Junior',
    required_stacks: ['Spring', 'PostgreSQL'],
    deadline: '2026-01-20',
    status: 'CLOSED',
    created_at: '2026-01-01T10:00:00',
  },
];

export const RESUMES: ResumeRow[] = [
  {
    id: 5001,
    applicant_id: CURRENT_APPLICANT_ID,
    title: 'Resume v1',
    file_url: 'https://example.com/resume.pdf',
    created_at: '2026-01-01T12:00:00',
  },
];

export const APPLICATIONS: ApplicationRow[] = [
  {
    id: 7001,
    job_post_id: 1001,
    applicant_id: CURRENT_APPLICANT_ID,
    resume_id: 5001,
    status: 'INTERVIEW_SCHEDULED',
    applied_at: '2026-01-05T09:10:00',
  },
  {
    id: 7002,
    job_post_id: 1002,
    applicant_id: CURRENT_APPLICANT_ID,
    resume_id: 5001,
    status: 'INTERVIEW_SCHEDULED',
    applied_at: '2026-01-07T11:30:00',
  },
  {
    id: 7003,
    job_post_id: 1003,
    applicant_id: CURRENT_APPLICANT_ID,
    resume_id: 5001,
    status: 'APPLIED',
    applied_at: '2026-01-12T14:00:00',
  },
];

export const INTERVIEWS: InterviewRow[] = [
  {
    id: 9003,
    application_id: 7001,
    room_id: 'room_frontend_intern_9003',
    scheduled_at: '2026-01-10T16:00:00',
    status: 'DONE',
  },
  {
    id: 9001,
    application_id: 7001,
    room_id: 'room_frontend_intern_9001',
    scheduled_at: '2026-01-21T13:00:00',
    status: 'DONE',
  },
  {
    id: 9002,
    application_id: 7002,
    room_id: 'room_web_dev_9002',
    scheduled_at: '2026-01-23T10:30:00',
    status: 'DONE',
  },
  {
    id: 9100,
    application_id: 7001,
    room_id: 'room_frontend_intern_9100',
    scheduled_at: '2026-01-26T10:00:00',
    status: 'SCHEDULED',
  },
  {
    id: 9101,
    application_id: 7002,
    room_id: 'room_web_dev_9101',
    scheduled_at: '2026-01-26T11:00:00',
    status: 'SCHEDULED',
  },
];

export const SCRAPS: ScrapRow[] = [
  {
    id: 8001,
    applicant_id: CURRENT_APPLICANT_ID,
    job_post_id: 1002,
    created_at: '2026-01-03T08:03:12',
  },
  {
    id: 8002,
    applicant_id: CURRENT_APPLICANT_ID,
    job_post_id: 1001,
    created_at: '2026-01-03T21:44:05',
  },
  {
    id: 8003,
    applicant_id: CURRENT_APPLICANT_ID,
    job_post_id: 1003,
    created_at: '2026-01-04T10:15:00',
  },
];

// ===== View Models =====
export type InterviewListStatus = 'UPCOMING' | 'DONE';

export type InterviewSessionView = {
  interview_id: number;
  application_id: number;
  room_id: string;
  scheduledAt: string;

  job_post_id: number;
  postingTitle: string;
  companyName: string;

  applicantName?: string;

  status: InterviewListStatus;
};

type ApiStatusLike = string | null | undefined;

function pickString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function pickCompanyName(jobPosting: InterviewApiRow['jobPosting']): string | null {
  if (!jobPosting) return null;

  const jp = jobPosting as InterviewApiRow['jobPosting'] & {
    companyName?: unknown;
    company?: {
      name?: unknown;
      companies_name?: unknown;
      corpName?: unknown;
      companyName?: unknown;
    } | null;
    companies_name?: unknown;
    corpName?: unknown;
  };

  return (
    pickString(jp.companyName) ??
    pickString(jp.company?.companyName) ??
    pickString(jp.company?.name) ??
    pickString(jp.company?.companies_name) ??
    pickString(jp.company?.corpName) ??
    pickString(jp.companies_name) ??
    pickString(jp.corpName)
  );
}

function toInterviewListStatus(apiStatus: ApiStatusLike, scheduledAt: string): InterviewListStatus {
  const normalized = (apiStatus ?? '').toString().trim().toUpperCase();
  if (
    normalized.includes('DONE') ||
    normalized.includes('COMPLETED') ||
    normalized.includes('FINISHED') ||
    normalized.includes('CANCEL')
  ) {
    return 'DONE';
  }

  const t = new Date(scheduledAt).getTime();
  if (Number.isFinite(t) && t < Date.now()) return 'DONE';

  return 'UPCOMING';
}

function toInterviewSessionViewFromApi(row: InterviewApiRow): InterviewSessionView | null {
  const interviewId = typeof row.id === 'number' ? row.id : Number(row.id);
  if (!Number.isFinite(interviewId)) return null;

  const scheduledAt =
    pickString(row.time) ?? pickString(row.scheduledAt) ?? pickString(row.scheduled_at);
  if (!scheduledAt) return null;

  const jobPosting = row.jobPosting ?? null;
  const jobPostIdRaw = row.jobPostingId ?? row.job_posting_id ?? jobPosting?.id;
  const jobPostId = typeof jobPostIdRaw === 'number' ? jobPostIdRaw : Number(jobPostIdRaw);
  const safeJobPostId = Number.isFinite(jobPostId) ? jobPostId : interviewId;

  const postingTitle = pickString(jobPosting?.title) ?? `Interview #${interviewId}`;
  const companyName = pickCompanyName(jobPosting) ?? '-';
  const applicantName = pickString(row.user?.name) ?? undefined;

  const applicationIdRaw =
    row.applicationId ?? row.application_id ?? row.jobPostingId ?? row.job_posting_id ?? interviewId;
  const applicationId = Number.isFinite(Number(applicationIdRaw))
    ? Number(applicationIdRaw)
    : interviewId;

  const roomId = pickString(row.roomId) ?? pickString(row.room_id) ?? `room_${interviewId}`;

  return {
    interview_id: interviewId,
    application_id: applicationId,
    room_id: roomId,
    scheduledAt,
    job_post_id: safeJobPostId,
    postingTitle,
    companyName,
    applicantName,
    status: toInterviewListStatus(row.status, scheduledAt),
  };
}

function sortByScheduledAt(a: InterviewSessionView, b: InterviewSessionView) {
  return a.scheduledAt > b.scheduledAt ? 1 : -1;
}

async function buildInterviewViewsFromApi(): Promise<InterviewSessionView[]> {
  const rows = await fetchInterviewRowsForMe();
  const mapped = rows
    .map((row) => toInterviewSessionViewFromApi(row))
    .filter((it): it is InterviewSessionView => Boolean(it));

  const extra = getExtraInterviewViews();
  const map = new Map<number, InterviewSessionView>();
  for (const item of mapped) map.set(item.interview_id, item);
  for (const item of extra) map.set(item.interview_id, item);

  return Array.from(map.values()).sort(sortByScheduledAt);
}

export type ScrapView = {
  scrap_id: number;
  job_post_id: number;
  postingTitle: string;
  companyName: string;
  createdAt: string;
};

function interviewStatusToListStatus(s: InterviewStatus): InterviewListStatus {
  return s === 'DONE' ? 'DONE' : 'UPCOMING';
}

/* =====================================================================================
   ✅ localStorage: 기업이 만든 면접 일정 (백엔드 없을 때)
   ===================================================================================== */

export type CreateExtraInterviewArgs = {
  application_id: number;
  job_post_id: number;
  postingTitle: string;
  companyName: string;
  scheduledAt: string; // ISO
  applicantName?: string;
  room_id?: string;
};

type ExtraInterviewPersisted = {
  interview_id: number;
  application_id: number;
  room_id: string;
  scheduledAt: string;
  job_post_id: number;
  postingTitle: string;
  companyName: string;
  applicantName?: string;
  status: InterviewListStatus;
  createdAt: string;
};

const EXTRA_KEY = 'pm_extra_interviews_v1';
const EXTRA_NEXT_ID_KEY = 'pm_extra_interviews_next_id_v1';

function isBrowser() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function readExtras(): ExtraInterviewPersisted[] {
  if (!isBrowser()) return [];
  return safeJsonParse<ExtraInterviewPersisted[]>(localStorage.getItem(EXTRA_KEY), []);
}

function writeExtras(items: ExtraInterviewPersisted[]) {
  if (!isBrowser()) return;
  localStorage.setItem(EXTRA_KEY, JSON.stringify(items));
}

function nextExtraId(): number {
  if (!isBrowser()) return Math.floor(Math.random() * 1_000_000) + 100_000;

  const raw = localStorage.getItem(EXTRA_NEXT_ID_KEY);
  const current = raw ? Number(raw) : 100_000;
  const safe = Number.isFinite(current) && current > 0 ? current : 100_000;

  const next = safe + 1;
  localStorage.setItem(EXTRA_NEXT_ID_KEY, String(next));
  return safe;
}

function statusFromTime(iso: string): InterviewListStatus {
  const t = new Date(iso).getTime();
  const now = Date.now();
  if (!Number.isFinite(t)) return 'UPCOMING';
  return t < now ? 'DONE' : 'UPCOMING';
}

function toView(e: ExtraInterviewPersisted): InterviewSessionView {
  return {
    interview_id: e.interview_id,
    application_id: e.application_id,
    room_id: e.room_id,
    scheduledAt: e.scheduledAt,
    job_post_id: e.job_post_id,
    postingTitle: e.postingTitle,
    companyName: e.companyName,
    applicantName: e.applicantName,
    status: e.status,
  };
}

function buildExtraInterviewViews(): InterviewSessionView[] {
  const extras = readExtras();
  return extras.map(toView);
}

export function getExtraInterviewViews(): InterviewSessionView[] {
  return buildExtraInterviewViews();
}

export function getExtraInterviewViewByApplicationId(
  applicationId: number,
): InterviewSessionView | undefined {
  return buildExtraInterviewViews().find((v) => v.application_id === applicationId);
}

/** ✅ 생성 */
export function createExtraInterviewView(args: CreateExtraInterviewArgs): InterviewSessionView {
  const interviewId = nextExtraId();
  const roomId =
    args.room_id?.trim() ||
    `room_${args.job_post_id}_${args.application_id}_${String(interviewId)}`;

  const status = statusFromTime(args.scheduledAt);

  const persisted: ExtraInterviewPersisted = {
    interview_id: interviewId,
    application_id: args.application_id,
    room_id: roomId,
    scheduledAt: args.scheduledAt,
    job_post_id: args.job_post_id,
    postingTitle: args.postingTitle,
    companyName: args.companyName,
    applicantName: args.applicantName,
    status,
    createdAt: new Date().toISOString(),
  };

  const prev = readExtras();
  writeExtras([persisted, ...prev]);

  return toView(persisted);
}

/** ✅ 수정(면접ID 기준) */
export function updateExtraInterviewScheduledAt(interviewId: number, nextIso: string): boolean {
  const prev = readExtras();
  const idx = prev.findIndex((p) => p.interview_id === interviewId);
  if (idx < 0) return false;

  const next = [...prev];
  const target = next[idx];

  next[idx] = {
    ...target,
    scheduledAt: nextIso,
    status: statusFromTime(nextIso),
  };

  writeExtras(next);
  return true;
}

/** ✅ 업서트(지원서ID 기준): 없으면 생성, 있으면 수정 */
export function upsertExtraInterviewView(args: CreateExtraInterviewArgs): InterviewSessionView {
  const prev = readExtras();
  const idx = prev.findIndex((p) => p.application_id === args.application_id);

  if (idx < 0) return createExtraInterviewView(args);

  const target = prev[idx];
  const roomId = args.room_id?.trim() || target.room_id;
  const status = statusFromTime(args.scheduledAt);

  const updated: ExtraInterviewPersisted = {
    ...target,
    room_id: roomId,
    scheduledAt: args.scheduledAt,
    job_post_id: args.job_post_id,
    postingTitle: args.postingTitle,
    companyName: args.companyName,
    applicantName: args.applicantName ?? target.applicantName,
    status,
  };

  const next = [...prev];
  next[idx] = updated;
  writeExtras(next);

  return toView(updated);
}

export function clearExtraInterviewViews() {
  if (!isBrowser()) return;
  localStorage.removeItem(EXTRA_KEY);
  localStorage.removeItem(EXTRA_NEXT_ID_KEY);
}

// ===== joins for applicant-side mock =====
export function buildMyInterviewViews(
  applicantId: number = CURRENT_APPLICANT_ID,
): InterviewSessionView[] {
  const myApps = APPLICATIONS.filter((a) => a.applicant_id === applicantId);

  const views: InterviewSessionView[] = [];
  for (const iv of INTERVIEWS) {
    const app = myApps.find((a) => a.id === iv.application_id);
    if (!app) continue;

    const post = JOB_POSTS.find((p) => p.id === app.job_post_id);
    if (!post) continue;

    const company = COMPANIES.find((c) => c.id === post.company_id);
    if (!company) continue;

    views.push({
      interview_id: iv.id,
      application_id: app.id,
      room_id: iv.room_id,
      scheduledAt: iv.scheduled_at,
      job_post_id: post.id,
      postingTitle: post.title,
      companyName: company.companies_name,
      status: interviewStatusToListStatus(iv.status),
    });
  }

  return views.sort((a, b) => (a.scheduledAt > b.scheduledAt ? 1 : -1));
}

export function buildAllInterviewViews(applicantId: number = CURRENT_APPLICANT_ID) {
  const base = buildMyInterviewViews(applicantId);
  const extra = buildExtraInterviewViews();

  const map = new Map<number, InterviewSessionView>();
  for (const b of base) map.set(b.interview_id, b);
  for (const e of extra) map.set(e.interview_id, e);

  return Array.from(map.values()).sort((a, b) => (a.scheduledAt > b.scheduledAt ? 1 : -1));
}

export function getMyUpcomingInterviewViews(limit = 2): InterviewSessionView[] {
  const nowMs = Date.now();
  return buildAllInterviewViews()
    .filter((v) => v.status === 'UPCOMING')
    .filter((v) => new Date(v.scheduledAt).getTime() >= nowMs)
    .slice(0, limit);
}

export function getMyInterviewViewsByStatus(status: InterviewListStatus): InterviewSessionView[] {
  return buildAllInterviewViews().filter((v) => v.status === status);
}

export function getMyInterviewViewById(interviewId: number): InterviewSessionView | undefined {
  return buildAllInterviewViews().find((v) => v.interview_id === interviewId);
}

export function buildMyScrapViews(applicantId: number = CURRENT_APPLICANT_ID): ScrapView[] {
  const myScraps = SCRAPS.filter((s) => s.applicant_id === applicantId);

  return myScraps
    .map((s) => {
      const post = JOB_POSTS.find((p) => p.id === s.job_post_id);
      if (!post) return null;

      const company = COMPANIES.find((c) => c.id === post.company_id);
      if (!company) return null;

      return {
        scrap_id: s.id,
        job_post_id: post.id,
        postingTitle: post.title,
        companyName: company.companies_name,
        createdAt: s.created_at,
      } satisfies ScrapView;
    })
    .filter(Boolean) as ScrapView[];
}

// ===== mock fetch layer =====
export type PortfolioReport = {
  id: number;
  filename: string;
  analyzedAt: string;
  highlights: string[];
};

export type NotificationItem = {
  id: number;
  message: string;
  createdAt: string;
  read: boolean;
};

export const PORTFOLIO_REPORT: PortfolioReport = {
  id: 55,
  filename: 'portfolio.pdf',
  analyzedAt: '2026-01-18T22:05:00',
  highlights: ['React/TS 경험 강조', '프로젝트 성과 수치화 추천', 'CS 질문 대비 필요'],
};

export const NOTIFICATIONS: NotificationItem[] = [
  { id: 1, message: '내일 면접 일정이 있어요.', createdAt: '2026-01-20T09:00:00', read: false },
  { id: 2, message: '이력서 완성도가 높아졌어요.', createdAt: '2026-01-19T12:10:00', read: true },
  {
    id: 3,
    message: '포트폴리오 분석 리포트가 생성됐어요.',
    createdAt: '2026-01-18T22:06:00',
    read: true,
  },
];

type FetchOptions = { delayMs?: number; shouldFail?: boolean };

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

async function mockFetch<T>(value: T, options?: FetchOptions): Promise<T> {
  const delay = options?.delayMs ?? 300;
  await sleep(delay);
  if (options?.shouldFail) throw new Error('네트워크 오류가 발생했어요. 다시 시도해 주세요.');
  return value;
}

export function fetchMyInterviewViews(options?: FetchOptions): Promise<InterviewSessionView[]> {
  if (options?.shouldFail) {
    return Promise.reject(
      new Error('?ㅽ듃?뚰겕 ?ㅻ쪟媛 諛쒖깮?덉뼱?? ?ㅼ떆 ?쒕료??二쇱꽭??'),
    );
  }

  if (options?.delayMs && options.delayMs > 0) {
    return sleep(options.delayMs).then(() => buildInterviewViewsFromApi());
  }

  return buildInterviewViewsFromApi();
}

export function fetchMyUpcomingInterviewViews(
  limit = 2,
  options?: FetchOptions,
): Promise<InterviewSessionView[]> {
  const run = async () => {
    const views = await fetchMyInterviewViews(options);
    const nowMs = Date.now();
    return views
      .filter((v) => v.status === 'UPCOMING')
      .filter((v) => new Date(v.scheduledAt).getTime() >= nowMs)
      .slice(0, limit);
  };

  return run();
}

export function fetchMyScrapViews(options?: FetchOptions): Promise<ScrapView[]> {
  return mockFetch(buildMyScrapViews(), options);
}

export function fetchMyPortfolioReport(options?: FetchOptions): Promise<PortfolioReport> {
  return mockFetch(PORTFOLIO_REPORT, options);
}

export function fetchMyNotifications(options?: FetchOptions): Promise<NotificationItem[]> {
  return mockFetch(NOTIFICATIONS, options);
}

export function fetchMyInterviewViewsByStatus(
  status: InterviewListStatus,
  options?: FetchOptions,
): Promise<InterviewSessionView[]> {
  const run = async () => {
    const views = await fetchMyInterviewViews(options);
    return views.filter((v) => v.status === status);
  };

  return run();
}

export function fetchMyInterviewViewById(
  interviewId: number,
  options?: FetchOptions,
): Promise<InterviewSessionView | undefined> {
  const run = async () => {
    const views = await fetchMyInterviewViews(options);
    return views.find((v) => v.interview_id === interviewId);
  };

  return run();
}
