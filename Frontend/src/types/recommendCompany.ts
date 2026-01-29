/**
 * 추천 기업 타입 정의
 * - 백엔드 API 응답 구조에 맞춰 설계
 * - API 연동 전에도 타입 안정성 확보
 */

/**
 * 개별 추천 기업 정보
 */
export interface RecommendedCompany {
  id: number;        // (프론트 키)
  /** 기업 고유 ID */
  companyId: number; 
  /** 기업명 */
  name: string;
  /** 추천 사유 (AI 분석 결과) */
  reason: string;
  /** 현재 채용 공고 수 */
  hiringCount: number;
  /** 기업의 주요 기술 스택 */
  stacks: string[];
  /** 추천 점수 (0-100, 높을수록 매칭도가 높음) */
  matchScore: number;
}


/**
 * API 응답 타입 (배열 직접 반환)
 * - 백엔드가 배열을 바로 응답할 경우 사용
 * @example
 * type RecommendedCompaniesResponse = RecommendedCompany[];
 */

/**
 * 정렬 기준 타입
 */
export type SortBy = 'score' | 'hiring';

/**
 * UI 뷰 상태 타입
 */
export type ViewState = 'ok' | 'loading' | 'empty' | 'error';

/**
 * 포트폴리오 기반 기업 추천 API 응답 타입
 * - GET /api/portfolios/{portfolioId}/recommendations/companies
 */
export interface CompanyRecommendationResponse {
  companyId: number;
  companyName: string;
  distance: number;
  similarity: number;
  portfolioProjectId: number;
  companyProjectId: number;
  portfolioContent: string;
  companyContent: string;
  projectDistance: number;
  domainDistance: number;
  problemDistance: number;
  solutionDistance: number;
  techDistance: number;
}

export interface BaseApiResponse<T> {
  status: boolean;
  code: number;
  message: string;
  data: T;
}

export interface ExplanationMatchRequestItem {
  companyId: number;
  portfolioProjectId: number;
  companyProjectId: number;
}

export interface ExplanationMatchHeadline {
  line1: string;
  highlight: string;
  line2: string;
  line3: string;
}

export interface ExplanationMatchSection {
  key: string;
  title: string;
  text?: string | null;
  tags?: string[] | null;
}

export interface ExplanationMatchPayload {
  companyName: string;
  headline: ExplanationMatchHeadline;
  sections: ExplanationMatchSection[];
}

export interface ExplanationMatchResponseItem {
  companyId: number;
  portfolioProjectId: number;
  companyProjectId: number;
  success: boolean;
  payload?: ExplanationMatchPayload | null;
  error?: string | null;
}
