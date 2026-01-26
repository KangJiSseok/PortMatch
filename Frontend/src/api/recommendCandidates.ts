import axiosInstance from '@/api/axiosInstance';
import type { Candidate } from '@/types/recommendCandidate';

export type CandidateListParams = {
  q?: string;
  sort?: 'score' | 'recent';
};

export async function fetchRecommendedCandidates(params: CandidateListParams) {
  const res = await axiosInstance.get<Candidate[]>('/corporate/recommended-candidates', { params });
  return res.data;
}

export async function toggleCandidateLike(candidateId: number) {
  const res = await axiosInstance.post<{ liked: boolean }>(`/candidates/${candidateId}/like`);
  return res.data;
}

export async function toggleCandidateFollow(candidateId: number) {
  const res = await axiosInstance.post<{ followed: boolean }>(`/candidates/${candidateId}/follow`);
  return res.data;
}

export async function toggleCandidateScrap(candidateId: number) {
  const res = await axiosInstance.post<{ scrapped: boolean }>(`/candidates/${candidateId}/scrap`);
  return res.data;
}
