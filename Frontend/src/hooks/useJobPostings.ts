import { useQuery } from '@tanstack/react-query';
import { fetchJobPostings } from '@/api/jobPosting';
import type { JobSort } from '@/types/jobPosting';

interface UseJobPostingsParams {
  companyId: number;
  page: number;
  size: number;
  sort: JobSort;
  enabled?: boolean;
}

export function useJobPostings({ companyId, page, size, sort, enabled = true }: UseJobPostingsParams) {
  return useQuery({
    queryKey: ['jobPostings', companyId, page, size, sort],
    queryFn: () => fetchJobPostings({ companyId, page, size, sort }),
    enabled,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
