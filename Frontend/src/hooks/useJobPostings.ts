// src/hooks/useJobPostings.ts
import { useQuery } from '@tanstack/react-query';
import { fetchJobPostings } from '@/api/jobPostings';

export function useJobPostings() {
  return useQuery({
    queryKey: ['job-postings'],
    queryFn: fetchJobPostings,
    staleTime: 30_000,
  });
}
