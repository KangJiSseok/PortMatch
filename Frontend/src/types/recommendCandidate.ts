export type CandidateSortBy = 'score' | 'recent';

export type Candidate = {
  id: number;
  name: string;
  headline: string; // 검색한 키워드 관련 요약
  matchScore: number;
  stacks: string[];
  keywords: string[];
  updatedAt: string; // "최근 업데이트" 정렬용

  // UI 상태(서버에서 내려오거나, 프론트에서 관리해도 됨)
  liked: boolean;
  followed: boolean;
  scrapped: boolean;
};
