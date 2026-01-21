export type JobSort = 'latest'; // 필요하면 'deadline' 등 확장

export interface JobPosting {
  id: number;
  title: string;
  companyId: number;
  companyName: string;
  location?: string;
  deadline?: string; // 'D-3' / '오늘마감' 등 문자열
  tags?: string[];
}

export interface JobPostingListResponse {
  content: JobPosting[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
