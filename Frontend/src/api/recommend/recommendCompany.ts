import axiosInstance from '@/api/axiosInstance';
import type {
  CompanyRecommendationResponse,
  ExplanationMatchRequestItem,
  ExplanationMatchResponseItem,
  BaseApiResponse,
} from '@/types/recommendCompany';

/**
 * 포트폴리오 기반 기업 추천 목록 조회
 */
export async function fetchPortfolioRecommendedCompanies(
  portfolioId: number | string,
): Promise<CompanyRecommendationResponse[]> {
  const res = await axiosInstance.get<CompanyRecommendationResponse[]>(
    `/portfolios/${portfolioId}/recommendations/companies`,
  );
  return res.data;
}

export async function fetchCompanyMatchExplanation(
  request: ExplanationMatchRequestItem,
): Promise<ExplanationMatchResponseItem> {
  const res = await axiosInstance.post<BaseApiResponse<ExplanationMatchResponseItem>>(
    '/company-projects/analysis/explanations',
    request,
  );

  if (!res.data?.status) {
    throw new Error(res.data?.message || '합격전략리포트를 불러오지 못했습니다.');
  }

  return res.data.data;
}
