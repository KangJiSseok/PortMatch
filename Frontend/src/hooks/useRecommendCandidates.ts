import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchRecommendedCandidates } from '@/api/company/recommendCandidates';
import type {
  RecommendCandidatesRequest,
  RecommendCandidatesResponse,
  CandidateCardModel,
  CandidateFactor,
  CandidateWeights,
  RecommendCandidate,
} from '@/types/recommendCandidate';

/** ---------------- Factor 정의 ---------------- */

const FACTOR_ORDER: CandidateFactor[] = ['기술', '주제', '아키텍처', '맥락'];

/** ---------------- Utils ---------------- */

function toScore(similarity: number): number {
  if (!Number.isFinite(similarity)) return 0;
  return Math.max(0, Math.min(100, Math.round(similarity * 100)));
}

/**
 * similarity(0~1) -> weights(% 합 100)
 * - 값이 클수록 비중 크게
 * - 반올림 오차는 가장 큰 항목에 몰아줌
 */
function similaritiesToScores(input: Record<CandidateFactor, number>): CandidateWeights {
  const out = {} as CandidateWeights;
  FACTOR_ORDER.forEach((k) => {
    out[k] = toScore(input[k] ?? 0);
  });
  return out;
}

function pickTopFactors(weights: CandidateWeights, n = 2): CandidateFactor[] {
  return [...FACTOR_ORDER].sort((a, b) => weights[b] - weights[a]).slice(0, n);
}

/** 백엔드 단건 -> UI 카드 모델 */
function mapToCardModel(item: RecommendCandidate, index: number): CandidateCardModel {
  const weights = similaritiesToScores({
    기술: item.techSimilarity,
    주제: item.keywordSimilarity,
    아키텍처: item.architectureSimilarity,
    맥락: item.unifiedSimilarity,
  });

  return {
    id: index + 1,
    userId: item.userId,
    portfolioId: item.portfolioId,
    matchScore: toScore(item.similarity ?? item.unifiedSimilarity ?? 0),
    weights,
    topFactors: pickTopFactors(weights, 2),
    summary: {
      tech: item.techText ?? '',
      keyword: item.keywordText ?? '',
      architecture: item.architectureText ?? '',
    },
    unifiedText: item.unifiedText ?? '',
  };
}

/** ---------------- Hook ---------------- */

export function useRecommendCandidates(params: RecommendCandidatesRequest) {
  const queryKey = useMemo(
    () => ['recommendCandidates', params.query, params.limit] as const,
    [params.query, params.limit],
  );

  const query = useQuery({
    queryKey,
    queryFn: () => fetchRecommendedCandidates(params),
    enabled: Boolean(params.query?.trim()) && (params.limit === undefined || params.limit > 0),
    staleTime: 30_000,
    retry: 1,
  });

  const cards: CandidateCardModel[] = useMemo(() => {
    const data = query.data;
    if (!data?.recommendations) return [];
    return data.recommendations.map(mapToCardModel);
  }, [query.data]);

  return {
    // 원본 응답 (상단 요약 영역에서 tech/keywords 같은 거 쓸 수 있음)
    response: query.data as RecommendCandidatesResponse | undefined,

    // 카드 렌더용 가공 데이터
    cards,

    // react-query 상태
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error as Error | null,

    // 필요하면 수동 재조회
    refetch: query.refetch,
  };
}
