// src/api/company/applications.ts
// ✅ 기업이 공고별 지원자 목록을 보는 화면용 "임시" API 레이어
// - 백엔드 연결되면 이 파일만 교체하면 됨

export type CompanyApplicationStatus = '미열람' | '열람함' | '합격' | '불합격';

export type CompanyApplicationView = {
  applicationId: number;
  jobPostId: number;
  postingTitle: string;
  companyName: string;

  applicantId: number;
  applicantName: string;
  experience: string;
  experienceYears: number;
  resumeId: string;

  appliedAt: string; // ISO
  status: CompanyApplicationStatus;
  isScrapped: boolean;
};

type FetchOptions = {
  delayMs?: number;
  shouldFail?: boolean;
};

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

async function mockFetch<T>(value: T, options?: FetchOptions): Promise<T> {
  const delay = options?.delayMs ?? 350;
  await sleep(delay);
  if (options?.shouldFail) throw new Error('지원자 목록을 불러오지 못했어요.');
  return value;
}

// ✅ 데모용 기본 데이터 (ResumeDetailPage의 기본 resumeId: "frontend"는 항상 존재)
const DEFAULT_APPLICATIONS: CompanyApplicationView[] = [
  {
    applicationId: 9101,
    jobPostId: 1001,
    postingTitle: '시니어 프론트엔드 개발자 채용',
    companyName: 'PortMatch',
    applicantId: 501,
    applicantName: '김싸피',
    experience: '프론트엔드 3년 (React/TS)',
    experienceYears: 3,
    resumeId: 'frontend',
    appliedAt: '2026-01-23T13:10:00',
    status: '미열람',
    isScrapped: false,
  },
  {
    applicationId: 9102,
    jobPostId: 1001,
    postingTitle: '시니어 프론트엔드 개발자 채용',
    companyName: 'PortMatch',
    applicantId: 502,
    applicantName: '이싸피',
    experience: '프론트엔드 1년 (Next.js)',
    experienceYears: 1,
    resumeId: 'frontend',
    appliedAt: '2026-01-26T09:40:00',
    status: '열람함',
    isScrapped: true,
  },
  {
    applicationId: 9103,
    jobPostId: 1001,
    postingTitle: '시니어 프론트엔드 개발자 채용',
    companyName: 'PortMatch',
    applicantId: 503,
    applicantName: '박싸피',
    experience: '프론트엔드 5년 (대규모 서비스)',
    experienceYears: 5,
    resumeId: 'frontend',
    appliedAt: '2026-01-27T18:25:00',
    status: '열람함',
    isScrapped: false,
  },
];

export async function fetchCompanyApplications(
  jobPostId: number,
  options?: FetchOptions,
): Promise<CompanyApplicationView[]> {
  const data = DEFAULT_APPLICATIONS.filter((a) => a.jobPostId === jobPostId);
  // ✅ jobPostId가 다른데도 일단 화면이 비지 않게: 첫 공고 데이터로 fallback
  const fallback = data.length > 0 ? data : DEFAULT_APPLICATIONS;
  return mockFetch(fallback, options);
}
