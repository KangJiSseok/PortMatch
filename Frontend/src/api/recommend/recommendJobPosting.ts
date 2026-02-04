import type { AxiosError } from 'axios';
import axiosInstance from '@/api/axiosInstance';
import type { ApiEnvelope, RecommendJobPostingsData } from '@/types/recommendJobPosting';

export async function fetchRecommendedJobPostings(
  portfolioId: number | string,
): Promise<RecommendJobPostingsData> {
  try {
    const res = await axiosInstance.get<ApiEnvelope<RecommendJobPostingsData>>(
      `/job-postings/match/portfolio/${portfolioId}`,
    );

    if (!res.data?.status) {
      throw new Error(res.data?.message || 'Failed to load recommended job postings.');
    }

    return res.data.data;
  } catch (err) {
    const ax = err as AxiosError<unknown>;
    const data = ax.response?.data as Record<string, unknown> | undefined;
    const serverMsg =
      (typeof data?.message === 'string' ? data.message : undefined) ||
      (typeof data?.error === 'string' ? data.error : undefined) ||
      ax.message ||
      'Failed to load recommended job postings.';

    throw new Error(serverMsg);
  }
}
