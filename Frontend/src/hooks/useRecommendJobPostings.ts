import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchRecommendedJobPostings } from '@/api/recommendJobPosting';
import type {
  JobPostingCardModel,
  JobPostingFactor,
  JobPostingWeights,
  RecommendJobPostingMatch,
  RecommendJobPostingsData,
} from '@/types/recommendJobPosting';

const FACTOR_ORDER: JobPostingFactor[] = ['Domain', 'Tech', 'Problem', 'Architecture'];

function toScore(similarity: number): number {
  if (!Number.isFinite(similarity)) return 0;
  if (similarity > 1) return Math.max(0, Math.min(100, Math.round(similarity)));
  return Math.max(0, Math.min(100, Math.round(similarity * 100)));
}

function similaritiesToScores(input: Record<JobPostingFactor, number>): JobPostingWeights {
  const out = {} as JobPostingWeights;
  FACTOR_ORDER.forEach((k) => {
    out[k] = toScore(input[k] ?? 0);
  });
  return out;
}

function pickTopFactors(weights: JobPostingWeights, n = 2): JobPostingFactor[] {
  return [...FACTOR_ORDER].sort((a, b) => weights[b] - weights[a]).slice(0, n);
}

function mapToCardModel(item: RecommendJobPostingMatch, index: number): JobPostingCardModel {
  const weights = similaritiesToScores({
    Domain: item.domainSimilarity,
    Tech: item.techSimilarity,
    Problem: item.problemSimilarity,
    Architecture: item.architectureSimilarity,
  });

  return {
    id: index + 1,
    jobPostingId: item.jobPostingId,
    title: item.title,
    companyName: item.companyName,
    matchScore: toScore(item.similarity ?? 0),
    weights,
    topFactors: pickTopFactors(weights, 2),
    problem: item.problem ?? '',
    solution: item.solution ?? '',
    portfolioContent: item.portfolioContent ?? '',
    jobPostingContent: item.jobPostingContent ?? '',
  };
}

export function useRecommendJobPostings(portfolioId: number | string | null | undefined) {
  const queryKey = useMemo(() => ['recommendJobPostings', portfolioId] as const, [portfolioId]);

  const query = useQuery({
    queryKey,
    queryFn: () => fetchRecommendedJobPostings(portfolioId as number | string),
    enabled: portfolioId !== null && portfolioId !== undefined && String(portfolioId).length > 0,
    staleTime: 30_000,
    retry: 1,
  });

  const cards: JobPostingCardModel[] = useMemo(() => {
    const data = query.data as RecommendJobPostingsData | undefined;
    if (!data?.matches) return [];
    return data.matches.map(mapToCardModel);
  }, [query.data]);

  return {
    response: query.data as RecommendJobPostingsData | undefined,
    cards,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}
