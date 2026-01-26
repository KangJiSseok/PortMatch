// src/api/mockData.ts
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

  // ✅ 2026-01-26 (5개)
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
  {
    id: 9102,
    application_id: 7001,
    room_id: 'room_frontend_intern_9102',
    scheduled_at: '2026-01-26T13:30:00',
    status: 'SCHEDULED',
  },
  {
    id: 9103,
    application_id: 7002,
    room_id: 'room_web_dev_9103',
    scheduled_at: '2026-01-26T15:00:00',
    status: 'SCHEDULED',
  },
  {
    id: 9000,
    application_id: 7001,
    room_id: 'room_frontend_intern_9000',
    scheduled_at: '2026-01-26T17:00:00',
    status: 'SCHEDULED',
  },

  // ✅ 2026-01-27 (5개)
  {
    id: 9104,
    application_id: 7001,
    room_id: 'room_frontend_intern_9104',
    scheduled_at: '2026-01-27T10:00:00',
    status: 'SCHEDULED',
  },
  {
    id: 9105,
    application_id: 7002,
    room_id: 'room_web_dev_9105',
    scheduled_at: '2026-01-27T11:00:00',
    status: 'SCHEDULED',
  },
  {
    id: 9106,
    application_id: 7001,
    room_id: 'room_frontend_intern_9106',
    scheduled_at: '2026-01-27T13:30:00',
    status: 'SCHEDULED',
  },
  {
    id: 9107,
    application_id: 7002,
    room_id: 'room_web_dev_9107',
    scheduled_at: '2026-01-27T15:00:00',
    status: 'SCHEDULED',
  },
  {
    id: 9108,
    application_id: 7001,
    room_id: 'room_frontend_intern_9108',
    scheduled_at: '2026-01-27T17:00:00',
    status: 'SCHEDULED',
  },

  // ✅ 2026-01-28 (5개)
  {
    id: 9109,
    application_id: 7001,
    room_id: 'room_frontend_intern_9109',
    scheduled_at: '2026-01-28T10:00:00',
    status: 'SCHEDULED',
  },
  {
    id: 9110,
    application_id: 7002,
    room_id: 'room_web_dev_9110',
    scheduled_at: '2026-01-28T11:00:00',
    status: 'SCHEDULED',
  },
  {
    id: 9111,
    application_id: 7001,
    room_id: 'room_frontend_intern_9111',
    scheduled_at: '2026-01-28T13:30:00',
    status: 'SCHEDULED',
  },
  {
    id: 9112,
    application_id: 7002,
    room_id: 'room_web_dev_9112',
    scheduled_at: '2026-01-28T15:00:00',
    status: 'SCHEDULED',
  },
  {
    id: 9113,
    application_id: 7001,
    room_id: 'room_frontend_intern_9113',
    scheduled_at: '2026-01-28T17:00:00',
    status: 'SCHEDULED',
  },

  // ✅ 2026-01-29 (5개)
  {
    id: 9114,
    application_id: 7001,
    room_id: 'room_frontend_intern_9114',
    scheduled_at: '2026-01-29T10:00:00',
    status: 'SCHEDULED',
  },
  {
    id: 9115,
    application_id: 7002,
    room_id: 'room_web_dev_9115',
    scheduled_at: '2026-01-29T11:00:00',
    status: 'SCHEDULED',
  },
  {
    id: 9116,
    application_id: 7001,
    room_id: 'room_frontend_intern_9116',
    scheduled_at: '2026-01-29T13:30:00',
    status: 'SCHEDULED',
  },
  {
    id: 9117,
    application_id: 7002,
    room_id: 'room_web_dev_9117',
    scheduled_at: '2026-01-29T15:00:00',
    status: 'SCHEDULED',
  },
  {
    id: 9118,
    application_id: 7001,
    room_id: 'room_frontend_intern_9118',
    scheduled_at: '2026-01-29T17:00:00',
    status: 'SCHEDULED',
  },

  // ✅ 2026-01-30 (5개)
  {
    id: 9119,
    application_id: 7001,
    room_id: 'room_frontend_intern_9119',
    scheduled_at: '2026-01-30T10:00:00',
    status: 'SCHEDULED',
  },
  {
    id: 9120,
    application_id: 7002,
    room_id: 'room_web_dev_9120',
    scheduled_at: '2026-01-30T11:00:00',
    status: 'SCHEDULED',
  },
  {
    id: 9121,
    application_id: 7001,
    room_id: 'room_frontend_intern_9121',
    scheduled_at: '2026-01-30T13:30:00',
    status: 'SCHEDULED',
  },
  {
    id: 9122,
    application_id: 7002,
    room_id: 'room_web_dev_9122',
    scheduled_at: '2026-01-30T15:00:00',
    status: 'SCHEDULED',
  },
  {
    id: 9123,
    application_id: 7001,
    room_id: 'room_frontend_intern_9123',
    scheduled_at: '2026-01-30T17:00:00',
    status: 'SCHEDULED',
  },

  // ✅ 2026-01-31 (5개)
  {
    id: 9124,
    application_id: 7001,
    room_id: 'room_frontend_intern_9124',
    scheduled_at: '2026-01-31T10:00:00',
    status: 'SCHEDULED',
  },
  {
    id: 9125,
    application_id: 7002,
    room_id: 'room_web_dev_9125',
    scheduled_at: '2026-01-31T11:00:00',
    status: 'SCHEDULED',
  },
  {
    id: 9126,
    application_id: 7001,
    room_id: 'room_frontend_intern_9126',
    scheduled_at: '2026-01-31T13:30:00',
    status: 'SCHEDULED',
  },
  {
    id: 9127,
    application_id: 7002,
    room_id: 'room_web_dev_9127',
    scheduled_at: '2026-01-31T15:00:00',
    status: 'SCHEDULED',
  },
  {
    id: 9128,
    application_id: 7001,
    room_id: 'room_frontend_intern_9128',
    scheduled_at: '2026-01-31T17:00:00',
    status: 'SCHEDULED',
  },
];

// scraps: 개인이 공고를 스크랩한 기록 (MyPage용)
export const SCRAPS: ScrapRow[] = [
  {
    id: 8001,
    applicant_id: CURRENT_APPLICANT_ID,
    job_post_id: 1002,
    created_at: '2026-01-03T08:00:00',
  },
  {
    id: 8002,
    applicant_id: CURRENT_APPLICANT_ID,
    job_post_id: 1001,
    created_at: '2026-01-04T10:15:00',
  },
  {
    id: 8003,
    applicant_id: CURRENT_APPLICANT_ID,
    job_post_id: 1001,
    created_at: '2026-01-04T10:15:00',
  },
  {
    id: 8004,
    applicant_id: CURRENT_APPLICANT_ID,
    job_post_id: 1001,
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

// ===== 조인 유틸 (ERD 관계대로 묶어줌) =====

export function buildMyInterviewViews(applicantId: number = CURRENT_APPLICANT_ID): InterviewSessionView[] {
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

export function getMyUpcomingInterviewViews(limit = 2): InterviewSessionView[] {
  // ✅ "상태(UPCOMING)"뿐 아니라 "시간 기준(미래)"도 같이 반영해두면 더 자연스러움
  const nowMs = Date.now();
  return buildMyInterviewViews()
    .filter((v) => v.status === 'UPCOMING')
    .filter((v) => new Date(v.scheduledAt).getTime() >= nowMs)
    .slice(0, limit);
}

export function getMyInterviewViewsByStatus(status: InterviewListStatus): InterviewSessionView[] {
  return buildMyInterviewViews().filter((v) => v.status === status);
}

export function getMyInterviewViewById(interviewId: number): InterviewSessionView | undefined {
  return buildMyInterviewViews().find((v) => v.interview_id === interviewId);
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

// ✅ MyPage용 더미 데이터는 mockData.ts 안에만 둠
export const PORTFOLIO_REPORT: PortfolioReport = {
  id: 55,
  filename: 'portfolio.pdf',
  analyzedAt: '2026-01-18T22:05:00',
  highlights: ['React/TS 경험 강조', '프로젝트 성과 수치화 추천', 'CS 질문 대비 필요'],
};

export const NOTIFICATIONS: NotificationItem[] = [
  { id: 1, message: '내일 면접 일정이 있어요.', createdAt: '2026-01-20T09:00:00', read: false },
  { id: 2, message: '이력서 완성도가 높아졌어요.', createdAt: '2026-01-19T12:10:00', read: true },
  { id: 3, message: '포트폴리오 분석 리포트가 생성됐어요.', createdAt: '2026-01-18T22:06:00', read: true },
];

type FetchOptions = {
  delayMs?: number;
  shouldFail?: boolean; // 상태 UI 테스트용
};

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

async function mockFetch<T>(value: T, options?: FetchOptions): Promise<T> {
  const delay = options?.delayMs ?? 500;
  await sleep(delay);

  if (options?.shouldFail) {
    throw new Error('네트워크 오류가 발생했어요. 다시 시도해 주세요.');
  }

  return value;
}

// ✅ “API처럼” 쓰는 함수들 (MyPage는 이걸로만 가져감)
export function fetchMyInterviewViews(options?: FetchOptions): Promise<InterviewSessionView[]> {
  return mockFetch(buildMyInterviewViews(), options);
}

export function fetchMyUpcomingInterviewViews(limit = 2, options?: FetchOptions): Promise<InterviewSessionView[]> {
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