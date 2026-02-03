export type ApiEnvelope<T> = {
  status: boolean;
  code: number;
  message: string;
  data: T;
};

export type RecommendJobPostingsRequest = {
  portfolioId: number | string;
};

export type RecommendJobPostingMatch = {
  jobPostingId: number;
  title: string;
  companyName: string;
  problem: string;
  solution: string;
  similarity: number;
  domainSimilarity: number;
  techSimilarity: number;
  problemSimilarity: number;
  architectureSimilarity: number;
  portfolioContent: string;
  jobPostingContent: string;
};

export type RecommendJobPostingsData = {
  matches: RecommendJobPostingMatch[];
};

export type JobPostingFactor = '도메인' | 'Tech' | 'Problem' | 'Architecture';

export type JobPostingWeights = Record<JobPostingFactor, number>;

export type JobPostingCardModel = {
  id: number;
  jobPostingId: number;
  title: string;
  companyName: string;
  matchScore: number;
  weights: JobPostingWeights;
  topFactors: JobPostingFactor[];
  problem: string;
  solution: string;
  portfolioContent: string;
  jobPostingContent: string;
};
