// src/hooks/useRecommendedCompanies.ts
import { useQuery } from '@tanstack/react-query';
import { fetchRecommendedCompanies } from '@/api/recommendCompany';
import type { RecommendedCompany } from '@/types/recommendCompany';

export function useRecommendedCompanies() {
  return useQuery<RecommendedCompany[], Error>({
    queryKey: ['recommendedCompanies'],
    queryFn: fetchRecommendedCompanies,
    staleTime: 5 * 60 * 1000, // 5분간 fresh 상태 유지
    gcTime: 10 * 60 * 1000, // 10분간 캐시 보관 (이전 cacheTime)
    retry: 2, // 실패 시 2번 재시도
    refetchOnWindowFocus: false, // 윈도우 포커스 시 자동 리페치 비활성화
  });
}
