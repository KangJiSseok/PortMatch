// src/hooks/useRecommendedCandidates.ts
import { useQuery } from '@tanstack/react-query';
import { fetchRecommendedCandidates } from '@/api/recommendCandidates';
import type { CandidateListParams } from '@/api/recommendCandidates';

export function useRecommendedCandidates(
  params: CandidateListParams,
  enabled = true,
) {
  return useQuery({
    queryKey: ['recommendedCandidates', params],
    queryFn: () => fetchRecommendedCandidates(params),
    enabled,
  });
}
