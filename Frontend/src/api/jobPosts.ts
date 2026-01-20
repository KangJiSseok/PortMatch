// src/api/jobPosts.ts
import type { CompanyRow, JobPostDetailView, JobPostRow, ResumeRow } from '../types/jobPost';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * ✅ Mock DB (ERD 기반)
 * - 실제 API 붙이면 여기 통째로 axios로 갈아끼우면 됨
 */
const COMPANIES: CompanyRow[] = [
  {
    id: 1,
    user_id: 201,
    business_registration_number: '123-45-67890',
    companies_name: '샘플테크',
    address: '서울특별시 어딘가 123',
    size: '중견기업',
    homepage_url: 'https://example.com',
  },
];

const JOB_POSTS: JobPostRow[] = [
  {
    id: 10,
    company_id: 1,
    title: 'Frontend Engineer (React)',
    requirement_text:
      `우리는 포트폴리오 기반 매칭 플랫폼을 만들고 있어요.\n\n` +
      `- React/TypeScript로 사용자 UI를 개발합니다.\n` +
      `- React Query 기반 데이터 흐름을 설계합니다.\n` +
      `- 유지보수 가능한 컴포넌트 구조를 지향합니다.`,
    required_stacks: ['React', 'TypeScript', 'Tailwind', 'React Query'],
    deadline: '2026-02-09',
    status: 'OPEN',
    created_at: '2026-01-18T09:15:00.000Z',
  },
];

// “내 이력서 목록” 더미 (resumes 테이블)
const MY_RESUMES: ResumeRow[] = [
  {
    id: 101,
    applicant_id: 1,
    title: '이력서 v1',
    file_url: 'https://example.com/resume.pdf',
    created_at: '2026-01-15T10:00:00.000Z',
  },
  {
    id: 102,
    applicant_id: 1,
    title: '이력서 v2 (최종)',
    file_url: 'https://example.com/resume2.pdf',
    created_at: '2026-01-19T08:30:00.000Z',
  },
];

// ==========================
// ✅ Scrap (ERD scraps 대응: applicant_id + job_post_id)
// 데모에선 applicant_id를 “1”로 고정해서 localStorage에 저장
// ==========================
const SCRAP_KEY = 'scraps_job_post_ids_v1';

function loadScrapSet(): Set<number> {
  if (typeof window === 'undefined') return new Set<number>();
  try {
    const raw = localStorage.getItem(SCRAP_KEY);
    if (!raw) return new Set<number>();
    const arr = JSON.parse(raw) as number[];
    return new Set(arr.filter((n) => Number.isFinite(n)));
  } catch {
    return new Set<number>();
  }
}

function saveScrapSet(set: Set<number>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SCRAP_KEY, JSON.stringify(Array.from(set)));
}

export function isJobPostScrapped(jobPostId: number) {
  return loadScrapSet().has(jobPostId);
}

export function toggleJobPostScrap(jobPostId: number) {
  const s = loadScrapSet();
  if (s.has(jobPostId)) s.delete(jobPostId);
  else s.add(jobPostId);
  saveScrapSet(s);
  return s.has(jobPostId);
}

// ==========================
// ✅ Fetchers
// ==========================
export async function fetchJobPostDetail(jobPostId: number): Promise<JobPostDetailView | null> {
  await sleep(450);

  const jobPost = JOB_POSTS.find((p) => p.id === jobPostId) ?? null;
  if (!jobPost) return null;

  const company = COMPANIES.find((c) => c.id === jobPost.company_id) ?? null;
  if (!company) return null;

  return {
    jobPost,
    company,
    isScrapped: isJobPostScrapped(jobPostId),
    external_apply_url: null, // TODO: 요구사항 “외부지원” 연결하려면 여기 값 내려주기
  };
}

export async function fetchMyResumes(): Promise<ResumeRow[]> {
  await sleep(350);
  return MY_RESUMES;
}

/**
 * ✅ applications 테이블 대응 (job_post_id, applicant_id, resume_id)
 * - 데모에선 applicant_id=1로 가정
 */
export async function createApplication(jobPostId: number, resumeId: number): Promise<{ applicationId: number }> {
  await sleep(600);

  const jobPostExists = JOB_POSTS.some((p) => p.id === jobPostId);
  const resumeExists = MY_RESUMES.some((r) => r.id === resumeId);

  if (!jobPostExists) throw new Error('공고가 존재하지 않습니다.');
  if (!resumeExists) throw new Error('이력서를 찾을 수 없습니다.');

  // 데모용 applicationId 생성
  return { applicationId: Math.floor(Math.random() * 900000) + 100000 };
}
