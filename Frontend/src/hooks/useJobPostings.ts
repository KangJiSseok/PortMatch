// src/hooks/useJobPostings.ts
import { useQuery } from '@tanstack/react-query';
import { fetchJobPostings } from '@/api/jobPostings';
import type { JobPostingListQuery } from '@/types/backendJobPosting';

export function useJobPostings(query: JobPostingListQuery) {
  return useQuery({
    queryKey: ['job-postings', query],
    queryFn: ({ signal }) => fetchJobPostings(query, signal),
    staleTime: 30_000,
  });
}
