import { useQuery } from '@tanstack/react-query';
import { fetchRecommendedCompanies } from '@/api/recommendCompany';
/**
 * 추천 기업 목록 조회 Hook
 *
 * @description
 * - React Query를 사용한 추천 기업 데이터 페칭
 * - 자동 캐싱, 리페칭, 에러 핸들링 지원
 * - 로딩/에러/성공 상태 자동 관리
 *
 * @returns {object} Query 결과 객체
 * @property {RecommendedCompany[] | undefined} data - 추천 기업 배열
 * @property {boolean} isLoading - 초기 로딩 상태
 * @property {boolean} isFetching - 페칭 중 상태 (백그라운드 리페치 포함)
 * @property {boolean} isError - 에러 발생 여부
 * @property {Error | null} error - 에러 객체
 * @property {() => void} refetch - 수동 리페치 함수
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { data: companies, isLoading, isError, refetch } = useRecommendedCompanies();
 *
 *   if (isLoading) return <LoadingState />;
 *   if (isError) return <ErrorState onRetry={refetch} />;
 *   if (!companies?.length) return <EmptyState />;
 *
 *   return (
 *     <ul>
 *       {companies.map(company => (
 *         <li key={company.id}>{company.name}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useRecommendedCompanies() {
  return useQuery({
    queryKey: ['recommendedCompanies'],
    queryFn: fetchRecommendedCompanies,
    staleTime: 5 * 60 * 1000, // 5분간 fresh 상태 유지
    gcTime: 10 * 60 * 1000, // 10분간 캐시 보관 (이전 cacheTime)
    retry: 2, // 실패 시 2번 재시도
    refetchOnWindowFocus: false, // 윈도우 포커스 시 자동 리페치 비활성화
  });
}

/**
 * 추천 기업 ID 배열 조회 Hook (선택적)
 *
 * @description 추천 기업의 ID만 필요한 경우 사용
 *
 * @example
 * ```tsx
 * const { data: companyIds } = useRecommendedCompanyIds();
 * // [1, 2, 3]
 * ```
 */
export function useRecommendedCompanyIds() {
  return useQuery({
    queryKey: ['recommendedCompanies', 'ids'],
    queryFn: async () => {
      const companies = await fetchRecommendedCompanies();
      return companies.map((c) => c.id);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
