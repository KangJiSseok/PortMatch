import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchRecommendedCandidates } from '@/api/recommendCandidates';
import type {
  RecommendCandidatesRequest,
  RecommendCandidatesResponse,
  CandidateCardModel,
  CandidateFactor,
  CandidateWeights,
  RecommendCandidate,
} from '@/types/recommendCandidate';

/** ---------------- Factor 정의 ---------------- */

const FACTOR_ORDER: CandidateFactor[] = ['기술', '키워드', '아키텍처', '종합'];

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
function similaritiesToWeights(input: Record<CandidateFactor, number>): CandidateWeights {
  const safe: Record<CandidateFactor, number> = {
    기술: Math.max(0, input.기술 ?? 0),
    키워드: Math.max(0, input.키워드 ?? 0),
    아키텍처: Math.max(0, input.아키텍처 ?? 0),
    종합: Math.max(0, input.종합 ?? 0),
  };

  const sum = FACTOR_ORDER.reduce((acc, k) => acc + safe[k], 0);

  // 방어: 전부 0이면 균등
  if (sum <= 0) {
    const even = Math.floor(100 / FACTOR_ORDER.length);
    const base: CandidateWeights = {
      기술: even,
      키워드: even,
      아키텍처: even,
      종합: even,
    };
    const remain = 100 - even * FACTOR_ORDER.length;
    if (remain > 0) base[FACTOR_ORDER[0]] += remain;
    return base;
  }

  const raw = FACTOR_ORDER.map((k) => ({ k, v: (safe[k] / sum) * 100 }));

  const rounded: CandidateWeights = {
    기술: 0,
    키워드: 0,
    아키텍처: 0,
    종합: 0,
  };

  raw.forEach(({ k, v }) => {
    rounded[k] = Math.round(v);
  });

  const total = FACTOR_ORDER.reduce((acc, k) => acc + rounded[k], 0);
  const diff = 100 - total;

  if (diff !== 0) {
    const maxKey = raw.sort((a, b) => b.v - a.v)[0]?.k ?? FACTOR_ORDER[0];
    rounded[maxKey] = Math.max(0, rounded[maxKey] + diff);
  }

  return rounded;
}

function pickTopFactors(weights: CandidateWeights, n = 2): CandidateFactor[] {
  return [...FACTOR_ORDER].sort((a, b) => weights[b] - weights[a]).slice(0, n);
}

/** 백엔드 단건 -> UI 카드 모델 */
function mapToCardModel(item: RecommendCandidate, index: number): CandidateCardModel {
  const weights = similaritiesToWeights({
    기술: item.techSimilarity,
    키워드: item.keywordSimilarity,
    아키텍처: item.architectureSimilarity,
    종합: item.unifiedSimilarity,
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
