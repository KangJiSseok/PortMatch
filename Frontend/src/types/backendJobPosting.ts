// src/types/backendJobPosting.ts
export type ApiResponse<T> = {
  status: boolean;
  code: number;
  message: string;
  data: T;
};

export type StackDto = {
  id: number;
  stack_name: string;
};

export type CompanyDto = {
  cid: string;
  corpName: string;
  logo: string;
  corpAddr: string;
  // 나머지는 필요하면 추가
};

export type JobPostingDto = {
  id: number;    
  title: string;
  active: number;
  startDate: string;    // "2026-01-22"
  endDate: string;      // "2026-02-22"
  vcnt: number;
  cid: string;
  detail: string;
  jobType: number;
  company: CompanyDto;
  stackIds: number[];   // ✅ 여기랑 스택 id 매칭할 예정
};
