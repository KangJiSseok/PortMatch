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
