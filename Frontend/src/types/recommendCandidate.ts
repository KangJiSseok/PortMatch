/**
 * 공통 API Envelope
 * {
 *   status: boolean
 *   code: number
 *   message: string
 *   data: T
 * }
 */
export type ApiEnvelope<T> = {
  status: boolean;
  code: number;
  message: string;
  data: T;
};

/** ---------------- Request ---------------- */

export type RecommendCandidatesRequest = {
  /** 검색 쿼리 (기업/포트폴리오 기준 텍스트 등) */
  query: string;
  /** 최대 추천 인원 수 */
  limit?: number;
};

/** ---------------- Response Root ---------------- */

export type RecommendCandidatesResponse = {
  /** 공통 기술 키워드 */
  tech: string[];
  /** 핵심 키워드 */
  keywords: string[];
  /** 아키텍처 경험 요약 */
  architecture_experience: string[];
  /** 확장 개념 */
  expanded_concepts: string[];
  /** 추천 후보 리스트 */
  recommendations: RecommendCandidate[];
};

/** ---------------- Recommendation Item ---------------- */

/**
 * 개인(지원자) 추천 단건
 * - 기업추천 페이지의 Company 개념과 1:1 대응되는 "Candidate"
 */
export type RecommendCandidate = {
  userId: number;
  portfolioId: number;

  /** 세부 유사도 (0~1) */
  techSimilarity: number;
  keywordSimilarity: number;
  architectureSimilarity: number;
  unifiedSimilarity: number;

  /** 대표 텍스트 (카드 요약용) */
  techText: string;
  keywordText: string;
  architectureText: string;

  /**
   * 구조화된 전체 설명 텍스트
   * [기술] ...
   * [역량] ...
   * [아키텍처 경험] ...
   * [프로젝트] ...
   */
  unifiedText: string;

  /** 최종 유사도 (백엔드 계산 결과) */
  similarity: number;
};

/** ---------------- Page 전용 파생 타입 ---------------- */

/**
 * UI 카드에서 바로 쓰기 위한 가공 타입
 * (기업추천 페이지의 Company 역할)
 */
export type CandidateCardModel = {
  id: number; // UI용
  userId: number;
  portfolioId: number;

  /** 0~100 점수 */
  matchScore: number;

  /** 도넛 차트용 weight (% 합 100) */
  weights: CandidateWeights;

  /** 상위 요인 */
  topFactors: CandidateFactor[];

  /** 카드 요약 텍스트 */
  summary: {
    tech: string;
    keyword: string;
    architecture: string;
  };

  /** 상세 비교용 원문 */
  unifiedText: string;
};

/** ---------------- Factor / Weight ---------------- */

/**
 * 기업추천 페이지의
 * '프로젝트 | 도메인 | 문제 | 해결 | 기술스택'
 * 과 대응되는 개인추천 버전
 */
export type CandidateFactor =
  | '기술'
  | '주제'
  | '아키텍처'
  | '맥락';

export type CandidateWeights = Record<CandidateFactor, number>;
