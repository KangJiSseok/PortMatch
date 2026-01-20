// src/types/jobPost.ts

// ===== ERD row shapes =====
export type CompanyRow = {
  id: number;
  user_id: number;
  business_registration_number: string;
  companies_name: string; // ERD 컬럼명 그대로
  address: string;
  size?: string | null;
  homepage_url?: string | null;
};

export type JobPostRow = {
  id: number;
  company_id: number;
  title: string;
  requirement_text?: string | null;
  required_stacks?: string[] | null; // jsonb -> FE에서는 string[]로 씀
  deadline?: string | null; // YYYY-MM-DD
  status?: string | null; // OPEN/CLOSED 같은 값 가정
  created_at?: string | null; // ISO
  // ✅ UI 요약용(추후 ERD 확장 전까지 mock으로 사용)
  career?: '신입' | '경력' | '무관' | '신입·경력';
  education?: string;          // 예: '학력무관', '대졸(4년) 이상'
  employment_type?: string;    // 예: '정규직', '계약직', '인턴'
  work_location?: string;      // 예: '서울 강남구'
  work_schedule?: string;      // 예: '주 5일(월~금) 09:00~18:00'
  salary?: string;             // 예: '회사 내규에 따름', '면접 후 결정'
};

// resumes 테이블 (지원서 선택용)
export type ResumeRow = {
  id: number;
  applicant_id: number;
  title?: string | null;
  file_url?: string | null;
  created_at?: string | null; // ISO
};

// ===== FE view shapes (페이지에서 쓰기 편하게) =====
export type JobPostDetailView = {
  jobPost: JobPostRow;
  company: CompanyRow;

  // ERD scraps(applicant_id, job_post_id) 대응
  isScrapped: boolean;

  // (선택) ERD에는 없지만, 요구사항에 “외부 지원 링크”가 있어서 자리만 둠
  // TODO: 백엔드/DB 확장 시 job_posts에 컬럼 추가해서 내려주기
  external_apply_url?: string | null;
};
