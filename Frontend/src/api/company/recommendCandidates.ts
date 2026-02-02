import axios, { AxiosError } from 'axios';
import type {
  RecommendCandidatesRequest,
  RecommendCandidatesResponse,
  ApiEnvelope,
} from '@/types/recommendCandidate';

const USE_RECOMMEND_CANDIDATES_MOCK =
  import.meta.env.VITE_USE_RECOMMEND_CANDIDATES_MOCK === 'true';

const MOCK_RECOMMEND_CANDIDATES: RecommendCandidatesResponse = {
  tech: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Redis', 'AWS'],
  keywords: ['recommendation', 'search', 'similarity', 'scale', 'realtime', 'optimization'],
  architecture_experience: ['MSA', 'CQRS', 'Event-driven', 'Caching', 'Observability'],
  expanded_concepts: ['Ranking', 'Vector Search', 'Batch/Streaming', 'A/B Test'],
  recommendations: [
    {
      userId: 101,
      portfolioId: 1001,
      techSimilarity: 0.86,
      keywordSimilarity: 0.78,
      architectureSimilarity: 0.74,
      unifiedSimilarity: 0.82,
      techText: 'React, TypeScript dashboard build',
      keywordText: 'recommendation, similarity search',
      architectureText: 'Redis cache + queue async processing',
      unifiedText:
        '[기술] React/TypeScript, Node.js\n[키워드] 추천, 검색, 유사도\n[아키텍처 경험] 캐시/큐 기반 처리\n[프로젝트] 대시보드 성능 최적화 및 검색 개선',
      similarity: 0.82,
    },
    {
      userId: 102,
      portfolioId: 1002,
      techSimilarity: 0.72,
      keywordSimilarity: 0.81,
      architectureSimilarity: 0.69,
      unifiedSimilarity: 0.76,
      techText: 'Node.js API server build and deploy',
      keywordText: 'recommendation, ranking, realtime metrics',
      architectureText: 'CQRS pattern design',
      unifiedText:
        '[기술] Node.js, PostgreSQL\n[키워드] 추천, 랭킹, 실시간\n[아키텍처 경험] CQRS\n[프로젝트] 실시간 지표 기반 랭킹 제공',
      similarity: 0.76,
    },
    {
      userId: 103,
      portfolioId: 1003,
      techSimilarity: 0.64,
      keywordSimilarity: 0.7,
      architectureSimilarity: 0.83,
      unifiedSimilarity: 0.74,
      techText: 'AWS infra setup and operations',
      keywordText: 'scale, reliability',
      architectureText: 'Event-driven pipeline',
      unifiedText:
        '[기술] AWS, Lambda, S3\n[키워드] 대규모, 안정성\n[아키텍처 경험] Event-driven\n[프로젝트] 이벤트 기반 처리 파이프라인 구축',
      similarity: 0.74,
    },
    {
      userId: 104,
      portfolioId: 1004,
      techSimilarity: 0.9,
      keywordSimilarity: 0.66,
      architectureSimilarity: 0.62,
      unifiedSimilarity: 0.79,
      techText: 'React performance optimization and design system',
      keywordText: 'search UX improvement',
      architectureText: 'SSR/CSR mixed rendering',
      unifiedText:
        '[기술] React, Vite\n[키워드] 검색 UX\n[아키텍처 경험] SSR/CSR 혼합\n[프로젝트] 검색 페이지 성능 개선',
      similarity: 0.79,
    },
    {
      userId: 105,
      portfolioId: 1005,
      techSimilarity: 0.68,
      keywordSimilarity: 0.73,
      architectureSimilarity: 0.71,
      unifiedSimilarity: 0.7,
      techText: 'Python data pipeline processing',
      keywordText: 'batch processing, data quality',
      architectureText: 'ETL pipeline design',
      unifiedText:
        '[기술] Python\n[키워드] 배치, 데이터 품질\n[아키텍처 경험] ETL\n[프로젝트] 데이터 정제 및 파이프라인 구축',
      similarity: 0.7,
    },
    {
      userId: 106,
      portfolioId: 1006,
      techSimilarity: 0.76,
      keywordSimilarity: 0.75,
      architectureSimilarity: 0.78,
      unifiedSimilarity: 0.77,
      techText: 'Search API and indexing improvements',
      keywordText: 'similarity, search quality',
      architectureText: 'Cache + index design',
      unifiedText:
        '[기술] Elasticsearch, Redis\n[키워드] 유사도, 검색 품질\n[아키텍처 경험] Cache/Index\n[프로젝트] 검색 품질 개선',
      similarity: 0.77,
    },
  ],
};

/**
 * 개인 추천(유저 추천) 목록 조회
 * POST /api/portfolios/recommendations/users
 *
 * Auth: 너 말대로 "일단 없음" 기준으로 구현 (추후 필요하면 헤더만 추가하면 됨)
 */
export async function fetchRecommendedCandidates(
  body: RecommendCandidatesRequest,
): Promise<RecommendCandidatesResponse> {
  if (USE_RECOMMEND_CANDIDATES_MOCK || body.query?.trim().toLowerCase() === 'mock') {
    return new Promise((resolve) => {
      setTimeout(() => resolve(MOCK_RECOMMEND_CANDIDATES), 500);
    });
  }

  try {
    const res = await axios.post<ApiEnvelope<RecommendCandidatesResponse>>(
      `${import.meta.env.VITE_API_BASE_URL}/api/portfolios/recommendations/users`,
      body,
      {
        headers: {
          'Content-Type': 'application/json',
          // Authorization: `Bearer ${token}`, // ✅ 나중에 필요해지면 여기만 열면 됨
        },
        // withCredentials: true, // ✅ 쿠키 기반 인증이면 켜기
      },
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
