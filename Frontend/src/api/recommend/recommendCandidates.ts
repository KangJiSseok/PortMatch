import type { AxiosError } from 'axios';
import axiosInstance from '@/api/axiosInstance';
import type {
  RecommendCandidatesRequest,
  RecommendCandidatesResponse,
  ApiEnvelope,
} from '@/types/recommendCandidate';

/**
 * 개인 추천(유저 추천) 목록 조회
 * POST /api/portfolios/recommendations/users
 *
 * Auth: 너 말대로 "일단 없음" 기준으로 구현 (추후 필요하면 헤더만 추가하면 됨)
 */
export async function fetchRecommendedCandidates(
  body: RecommendCandidatesRequest,
): Promise<RecommendCandidatesResponse> {
  try {
    const res = await axiosInstance.post<ApiEnvelope<RecommendCandidatesResponse>>(
      '/portfolios/recommendations/users',
      body,
    );

    if (!res.data?.status) {
      // 백엔드가 status:false로 내려주는 케이스
      throw new Error(res.data?.message || '추천 후보 조회에 실패했습니다.');
    }

    return res.data.data;
  } catch (err) {
    // axios error message 정리
    const ax = err as AxiosError<unknown>;
    const data = ax.response?.data as Record<string, unknown> | undefined;
    const serverMsg =
      (typeof data?.message === 'string' ? data.message : undefined) ||
      (typeof data?.error === 'string' ? data.error : undefined) ||
      ax.message ||
      '추천 후보 조회에 실패했습니다.';

    throw new Error(serverMsg);
  }
}
