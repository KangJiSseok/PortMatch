import type { JobPostingListResponse, JobSort } from '@/types/jobPosting';

const MOCK: JobPostingListResponse = {
  content: [
    {
      id: 1,
      title: '네오랩스 프론트엔드 엔지니어 채용',
      companyId: 205,
      companyName: '네오랩스',
      location: '서울',
      deadline: 'D-5',
      tags: ['React', 'TypeScript'],
    },
    {
      id: 2,
      title: '네오랩스 UI 개발자 (신입/경력)',
      companyId: 205,
      companyName: '네오랩스',
      location: '경기',
      deadline: '상시',
      tags: ['Tailwind', 'A11y'],
    },
  ],
  page: 1,
  size: 20,
  totalElements: 2,
  totalPages: 1,
};

interface FetchJobPostingsParams {
  companyId: number;
  page: number;
  size: number;
  sort: JobSort;
}

export async function fetchJobPostings(params: FetchJobPostingsParams): Promise<JobPostingListResponse> {
  const { companyId, page, size, sort } = params;
  void page;
  void size;
  void sort;

  // ✅ 나중에 백엔드 붙을 때 여기만 교체하면 됨
  // const qs = new URLSearchParams({
  //   companyId: String(companyId),
  //   page: String(page),
  //   size: String(size),
  //   sort,
  // });
  // const response = await fetch(`/api/job-postings?${qs.toString()}`);
  // if (!response.ok) throw new Error('Failed to fetch job postings');
  // return response.json();

  // Mock (Day3용: 검색/페이지 바뀌는 구조 확인용)
  return new Promise((resolve) => {
    setTimeout(() => {
      // companyId가 다르면 0건처럼 보이게
      resolve(companyId === 205 ? MOCK : { ...MOCK, content: [], totalElements: 0, totalPages: 0 });
    }, 500);
  });
}
