// src/api/jobPosts.ts
import type { CompanyRow, JobPostDetailView, JobPostRow, ResumeRow } from '../types/jobPost';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** ✅ 날짜 유틸: 데모에서 D-day가 그럴싸하게 나오게 "오늘 기준"으로 생성 */
function toYmd(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
function addDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toYmd(d);
}
function isoNowPlus(minutes = 0) {
  const d = new Date();
  d.setMinutes(d.getMinutes() + minutes);
  return d.toISOString();
}

/**
 * ✅ Mock DB (ERD 기반 + UI요약필드 확장)
 */
const COMPANIES: CompanyRow[] = [
  {
    id: 1,
    user_id: 201,
    business_registration_number: '100-00-00001',
    companies_name: '신세계푸드',
    address: '서울 강남구 테헤란로 123',
    size: '대기업',
    homepage_url: 'https://www.shinsegaefood.com',
  },
  {
    id: 2,
    user_id: 202,
    business_registration_number: '100-00-00002',
    companies_name: '삼성전자',
    address: '경기 수원시 영통구 삼성로 129',
    size: '대기업',
    homepage_url: 'https://www.samsung.com',
  },
  {
    id: 3,
    user_id: 203,
    business_registration_number: '100-00-00003',
    companies_name: '네이버',
    address: '경기 성남시 분당구 정자일로 95',
    size: '대기업',
    homepage_url: 'https://www.navercorp.com',
  },
  {
    id: 4,
    user_id: 204,
    business_registration_number: '100-00-00004',
    companies_name: '현대자동차',
    address: '서울 서초구 헌릉로 12',
    size: '대기업',
    homepage_url: 'https://www.hyundai.com',
  },
  {
    id: 5,
    user_id: 205,
    business_registration_number: '100-00-00005',
    companies_name: '당근마켓',
    address: '서울 서초구 강남대로 465',
    size: '중견기업',
    homepage_url: 'https://www.daangn.com',
  },
  {
    id: 6,
    user_id: 206,
    business_registration_number: '100-00-00006',
    companies_name: '토스',
    address: '서울 강남구 테헤란로 142',
    size: '중견기업',
    homepage_url: 'https://toss.im',
  },
  {
    id: 7,
    user_id: 207,
    business_registration_number: '100-00-00007',
    companies_name: '쿠팡',
    address: '서울 송파구 송파대로 570',
    size: '대기업',
    homepage_url: 'https://www.coupang.com',
  },
  {
    id: 8,
    user_id: 208,
    business_registration_number: '100-00-00008',
    companies_name: '라인플러스',
    address: '경기 성남시 분당구 판교역로 235',
    size: '대기업',
    homepage_url: 'https://linepluscorp.com',
  },
  {
    id: 9,
    user_id: 209,
    business_registration_number: '100-00-00009',
    companies_name: '배달의민족',
    address: '서울 송파구 올림픽로 300',
    size: '대기업',
    homepage_url: 'https://www.woowahan.com',
  },

  // 메인페이지 MOCK_JOBS에 있던 회사들
  {
    id: 20,
    user_id: 220,
    business_registration_number: '100-00-00020',
    companies_name: '이젠아카데미 DX교육센터',
    address: '서울 서초구 서초대로 77',
    size: '교육기관',
    homepage_url: 'https://www.ezenac.co.kr',
  },
  {
    id: 21,
    user_id: 221,
    business_registration_number: '100-00-00021',
    companies_name: 'MBC아카데미 컴퓨터교육센터',
    address: '서울 마포구 양화로 45',
    size: '교육기관',
    homepage_url: 'https://edu.mbcacademy.co.kr',
  },
  {
    id: 22,
    user_id: 222,
    business_registration_number: '100-00-00022',
    companies_name: '카카오',
    address: '경기 성남시 분당구 판교역로 166',
    size: '대기업',
    homepage_url: 'https://www.kakaocorp.com',
  },
];

const JOB_POSTS: JobPostRow[] = [
  // ✅ 메인페이지 카드(id 1~4)랑 맞춰서 "바로 상세로 들어가도" 안 깨지게
  {
    id: 1,
    company_id: 1,
    title: '(주)신세계푸드 베이커리 제과 제품 개발 경력사원 모집',
    requirement_text:
      `- 베이커리 제품 개발 및 개선\n` +
      `- 원가/레시피 관리 및 품질 개선\n` +
      `- 관련 부서 협업 및 시장 트렌드 리서치`,
    required_stacks: ['제품개발', 'R&D', '품질관리', '시장조사'],
    deadline: addDays(0), // 오늘마감 느낌
    status: 'OPEN',
    created_at: isoNowPlus(-60 * 24 * 2),

    career: '경력',
    education: '대졸(4년) 이상',
    employment_type: '정규직',
    work_location: '서울 강남구',
    work_schedule: '주 5일(월~금) 09:00~18:00',
    salary: '면접 후 결정',
  },
  {
    id: 2,
    company_id: 20,
    title: '[취업캠프] UXUI 디자인 / 프론트엔드 실무 프로젝트 과정',
    requirement_text:
      `- UI/UX 기본기 + 실무 프로젝트 중심\n` +
      `- 포트폴리오 제작 및 코칭\n` +
      `- 취업 연계 프로그램 진행`,
    required_stacks: ['Figma', 'HTML', 'CSS', 'React'],
    deadline: addDays(90),
    status: 'OPEN',
    created_at: isoNowPlus(-60 * 24 * 6),

    career: '무관',
    education: '학력무관',
    employment_type: '인턴', // (데모용) 실제론 교육과정이지만 UI 형태 맞추려고
    work_location: '서울 서초구',
    work_schedule: '주 5일(월~금) 10:00~17:00',
    salary: '전액 지원/혜택 제공',
  },
  {
    id: 3,
    company_id: 21,
    title: '[AI 특화] 파이썬 기반 데이터 분석 및 AI 모델링 과정 모집',
    requirement_text:
      `- Python 데이터 분석\n` + `- 머신러닝/딥러닝 기초\n` + `- 프로젝트 기반 포트폴리오 완성`,
    required_stacks: ['Python', 'Pandas', 'PyTorch', 'ML'],
    deadline: addDays(12),
    status: 'OPEN',
    created_at: isoNowPlus(-60 * 24 * 4),

    career: '무관',
    education: '학력무관',
    employment_type: '인턴', // (데모용)
    work_location: '서울 마포구',
    work_schedule: '주 5일(월~금) 10:00~17:00',
    salary: '전액 지원/혜택 제공',
  },
  {
    id: 4,
    company_id: 22,
    title: '카카오 클라우드 플랫폼 엔지니어 대규모 채용',
    requirement_text:
      `- Kubernetes 기반 운영 환경 구축/개선\n` +
      `- 서비스 모니터링/장애 대응 체계 고도화\n` +
      `- IaC 기반 인프라 자동화`,
    required_stacks: ['Kubernetes', 'Terraform', 'AWS', 'Go'],
    deadline: addDays(7),
    status: 'OPEN',
    created_at: isoNowPlus(-60 * 24 * 1),

    career: '신입·경력',
    education: '학력무관',
    employment_type: '정규직',
    work_location: '경기 성남시',
    work_schedule: '주 5일(월~금) 09:00~18:00',
    salary: '회사 내규에 따름',
  },

  // ✅ 추천세트에 있던 회사들도 상세용 더미로 추가(아이디 충돌 피하려고 5~12)
  {
    id: 5,
    company_id: 2,
    title: '클라우드 아키텍트 채용',
    requirement_text: `- 대규모 클라우드 아키텍처 설계/개선\n- 보안/비용 최적화`,
    required_stacks: ['AWS', 'Kubernetes', 'Terraform', 'Security'],
    deadline: addDays(5),
    status: 'OPEN',
    created_at: isoNowPlus(-60 * 24 * 3),

    career: '경력',
    education: '학력무관',
    employment_type: '정규직',
    work_location: '경기 수원시',
    work_schedule: '주 5일(월~금) 09:00~18:00',
    salary: '면접 후 결정',
  },
  {
    id: 6,
    company_id: 3,
    title: 'UI/UX 프로덕트 디자이너',
    requirement_text: `- 제품 UX 전략 수립\n- Design System 운영/고도화`,
    required_stacks: ['Figma', 'Design System', 'UX Research'],
    deadline: addDays(60),
    status: 'OPEN',
    created_at: isoNowPlus(-60 * 24 * 10),

    career: '무관',
    education: '학력무관',
    employment_type: '정규직',
    work_location: '경기 성남시',
    work_schedule: '주 5일(월~금) 10:00~19:00',
    salary: '회사 내규에 따름',
  },
  {
    id: 7,
    company_id: 4,
    title: '자율주행 소프트웨어 개발',
    requirement_text: `- 자율주행 모듈 개발/검증\n- 시뮬레이션 기반 테스트 자동화`,
    required_stacks: ['C++', 'ROS', 'Python', 'Simulation'],
    deadline: addDays(10),
    status: 'OPEN',
    created_at: isoNowPlus(-60 * 24 * 5),

    career: '신입·경력',
    education: '대졸(4년) 이상',
    employment_type: '정규직',
    work_location: '서울 서초구',
    work_schedule: '주 5일(월~금) 09:00~18:00',
    salary: '면접 후 결정',
  },
  {
    id: 8,
    company_id: 5,
    title: '백엔드 엔지니어 (Kotlin)',
    requirement_text: `- 거래/알림 도메인 백엔드 개발\n- 성능/안정성 개선`,
    required_stacks: ['Kotlin', 'Spring', 'MySQL', 'Redis'],
    deadline: addDays(90),
    status: 'OPEN',
    created_at: isoNowPlus(-60 * 24 * 8),

    career: '경력',
    education: '학력무관',
    employment_type: '정규직',
    work_location: '서울 서초구',
    work_schedule: '주 5일(월~금) 10:00~19:00',
    salary: '회사 내규에 따름',
  },
  {
    id: 9,
    company_id: 6,
    title: '데이터 분석가 (Product)',
    requirement_text: `- 지표 설계/분석\n- 실험 설계(A/B 테스트) 및 인사이트 도출`,
    required_stacks: ['SQL', 'Python', 'Experiment', 'BI'],
    deadline: addDays(2),
    status: 'OPEN',
    created_at: isoNowPlus(-60 * 24 * 2),

    career: '신입·경력',
    education: '학력무관',
    employment_type: '정규직',
    work_location: '서울 강남구',
    work_schedule: '주 5일(월~금) 10:00~19:00',
    salary: '면접 후 결정',
  },
  {
    id: 10,
    company_id: 7,
    title: '물류 시스템 기획자',
    requirement_text: `- 물류 프로세스 개선\n- 운영 지표 설계/관리`,
    required_stacks: ['Data', 'Process', 'Ops'],
    deadline: addDays(14),
    status: 'OPEN',
    created_at: isoNowPlus(-60 * 24 * 7),

    career: '경력',
    education: '학력무관',
    employment_type: '정규직',
    work_location: '서울 송파구',
    work_schedule: '주 5일(월~금) 09:00~18:00',
    salary: '회사 내규에 따름',
  },
  {
    id: 11,
    company_id: 8,
    title: '글로벌 서비스 기획',
    requirement_text: `- 글로벌 서비스 정책/기획\n- 운영/프로세스 개선`,
    required_stacks: ['PM', 'Global', 'Data'],
    deadline: addDays(120),
    status: 'OPEN',
    created_at: isoNowPlus(-60 * 24 * 12),

    career: '무관',
    education: '학력무관',
    employment_type: '정규직',
    work_location: '경기 성남시',
    work_schedule: '주 5일(월~금) 10:00~19:00',
    salary: '회사 내규에 따름',
  },
  {
    id: 12,
    company_id: 9,
    title: '프론트엔드 개발자',
    requirement_text: `- 사용자 서비스 프론트엔드 개발\n- 성능 최적화 및 DX 개선`,
    required_stacks: ['React', 'TypeScript', 'Next.js'],
    deadline: addDays(4),
    status: 'OPEN',
    created_at: isoNowPlus(-60 * 24 * 6),

    career: '신입·경력',
    education: '학력무관',
    employment_type: '정규직',
    work_location: '서울 송파구',
    work_schedule: '주 5일(월~금) 10:00~19:00',
    salary: '면접 후 결정',
  },
];

// “내 이력서 목록” 더미 (resumes 테이블)
const MY_RESUMES: ResumeRow[] = [
  {
    id: 101,
    applicant_id: 1,
    title: '이력서 v1',
    file_url: 'https://example.com/resume.pdf',
    created_at: isoNowPlus(-60 * 24 * 8),
  },
  {
    id: 102,
    applicant_id: 1,
    title: '이력서 v2 (최종)',
    file_url: 'https://example.com/resume2.pdf',
    created_at: isoNowPlus(-60 * 24 * 4),
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
export async function createApplication(
  jobPostId: number,
  resumeId: number,
): Promise<{ applicationId: number }> {
  await sleep(600);

  const jobPostExists = JOB_POSTS.some((p) => p.id === jobPostId);
  const resumeExists = MY_RESUMES.some((r) => r.id === resumeId);

  if (!jobPostExists) throw new Error('공고가 존재하지 않습니다.');
  if (!resumeExists) throw new Error('이력서를 찾을 수 없습니다.');

  // 데모용 applicationId 생성
  return { applicationId: Math.floor(Math.random() * 900000) + 100000 };
}

// ✅ 비동기 버전 (Mock 네트워크 지연 포함)
export async function toggleJobPostScrapAsync(jobPostId: number, desired?: boolean) {
  await sleep(300); // 네트워크 지연 흉내

  const s = loadScrapSet();
  const next = desired ?? !s.has(jobPostId);

  if (next) s.add(jobPostId);
  else s.delete(jobPostId);

  saveScrapSet(s);
  return next;
}
