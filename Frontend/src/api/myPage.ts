// src/api/myPage.ts
// 개인 MVP용 최소 더미데이터 (ERD 기반)
// - MyPage (스크랩/다가오는 면접/캘린더용)
// - InterviewListPage (예정/완료 리스트)
// - InterviewLobbyPage (세션 상세/room_id)
// - InterviewRoomPage (세션 id/room_id 기반 입장 UI)

export type UserRole = 'APPLICANT' | 'COMPANY';

export type UserRow = {
  id: number;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string; // ISO
};

export type ApplicantRow = {
  id: number;
  user_id: number;
  birth_date?: string; // YYYY-MM-DD
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
  required_stacks?: string[]; // ERD jsonb → FE에서는 배열로 사용
  deadline?: string; // YYYY-MM-DD
  status: JobPostStatus;
  created_at: string; // ISO
};

export type ResumeRow = {
  id: number;
  applicant_id: number;
  title: string;
  file_url?: string;
  created_at: string; // ISO
};

export type ApplicationStatus = 'APPLIED' | 'INTERVIEW_SCHEDULED' | 'REJECTED' | 'HIRED';
export type ApplicationRow = {
  id: number;
  job_post_id: number;
  applicant_id: number;
  resume_id: number;
  status: ApplicationStatus;
  applied_at: string; // ISO
};

export type InterviewStatus = 'SCHEDULED' | 'DONE' | 'CANCELLED';
export type InterviewRow = {
  id: number;
  application_id: number;
  room_id: string;
  scheduled_at: string; // ISO
  status: InterviewStatus;
};

export type ScrapRow = {
  id: number;
  applicant_id: number;
  job_post_id: number;
  created_at: string; // ISO
};

// ===== 로그인한 현재 사용자(개인) =====
export const CURRENT_USER_ID = 1;
export const CURRENT_APPLICANT_ID = 1;

// ===== 원본 테이블 더미 =====
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

// applications: applicant가 job_post에 지원한 기록
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

// interviews: applications(0..1) → interviews
export const INTERVIEWS: InterviewRow[] = [
  // ✅ 완료(과거)
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

  // ✅ 예정 샘플
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

// ====== 페이지에서 쓰기 쉬운 "뷰 모델" ======

export type InterviewListStatus = 'UPCOMING' | 'DONE';

export type InterviewSessionView = {
  interview_id: number; // interviews.id
  application_id: number; // interviews.application_id
  room_id: string;
  scheduledAt: string; // interviews.scheduled_at

  job_post_id: number;
  postingTitle: string; // job_posts.title
  companyName: string; // companies.companies_name

  // ✅ 기업 화면에서 표시용(없어도 됨)
  applicantName?: string;

  status: InterviewListStatus;
};

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
   ✅ [중요] 기업이 “일정만 잡는” 상태를 지원하기 위한 localStorage 오버레이
   - interview 폴더(API) 없어도: createExtraInterviewView로 등록 → 리스트/로비에서 조회 가능
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

function buildExtraInterviewViews(): InterviewSessionView[] {
  const extras = readExtras();
  return extras.map((e) => ({
    interview_id: e.interview_id,
    application_id: e.application_id,
    room_id: e.room_id,
    scheduledAt: e.scheduledAt,

    job_post_id: e.job_post_id,
    postingTitle: e.postingTitle,
    companyName: e.companyName,

    applicantName: e.applicantName,

    status: e.status,
  }));
}

/** ✅ 기업이 일정 등록할 때 호출 */
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

  return {
    interview_id: persisted.interview_id,
    application_id: persisted.application_id,
    room_id: persisted.room_id,
    scheduledAt: persisted.scheduledAt,

    job_post_id: persisted.job_post_id,
    postingTitle: persisted.postingTitle,
    companyName: persisted.companyName,

    applicantName: persisted.applicantName,

    status: persisted.status,
  };
}

/** (옵션) 일정 수정 같은 거 붙일 때 쓰라고 준비만 해둠 */
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

/** (옵션) 테스트/초기화 */
export function clearExtraInterviewViews() {
  if (!isBrowser()) return;
  localStorage.removeItem(EXTRA_KEY);
  localStorage.removeItem(EXTRA_NEXT_ID_KEY);
}

// ===== 조인 유틸 (ERD 관계대로 묶어줌) =====

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

/** ✅ 기존 더미 + 기업이 만든(저장된) 면접을 합쳐서 보여주기 */
export function buildAllInterviewViews(applicantId: number = CURRENT_APPLICANT_ID) {
  const base = buildMyInterviewViews(applicantId);
  const extra = buildExtraInterviewViews();

  // 혹시나 id 충돌하면 extra 우선
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

/* =======================================================================
   ✅ MyPage에서 "파일 안에 더미를 넣지 않기" 위한 추가 mock API 레이어
   - 나중에 실제 API/React Query 붙일 때 여기 함수들만 교체하면 됨
   ======================================================================= */

export type PortfolioReport = {
  id: number;
  filename: string;
  analyzedAt: string; // ISO
  highlights: string[];
};

export type NotificationItem = {
  id: number;
  message: string;
  createdAt: string; // ISO
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

type FetchOptions = {
  delayMs?: number;
  shouldFail?: boolean; // 상태 UI 테스트용
};

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

async function mockFetch<T>(value: T, options?: FetchOptions): Promise<T> {
  const delay = options?.delayMs ?? 300;
  await sleep(delay);

  if (options?.shouldFail) {
    throw new Error('네트워크 오류가 발생했어요. 다시 시도해 주세요.');
  }

  return value;
}

// ✅ “API처럼” 쓰는 함수들 (MyPage는 이걸로만 가져감)
export function fetchMyInterviewViews(options?: FetchOptions): Promise<InterviewSessionView[]> {
  return mockFetch(buildAllInterviewViews(), options);
}

export function fetchMyUpcomingInterviewViews(
  limit = 2,
  options?: FetchOptions,
): Promise<InterviewSessionView[]> {
  return mockFetch(getMyUpcomingInterviewViews(limit), options);
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
  return mockFetch(getMyInterviewViewsByStatus(status), options);
}

export function fetchMyInterviewViewById(
  interviewId: number,
  options?: FetchOptions,
): Promise<InterviewSessionView | undefined> {
  return mockFetch(getMyInterviewViewById(interviewId), options);
}
