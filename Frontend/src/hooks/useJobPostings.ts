// src/hooks/useJobPostings.ts
import { useQuery } from '@tanstack/react-query';
import { fetchJobPostings, fetchJobPostingsByCompany } from '@/api/jobPostings';

export function useJobPostings(cid?: string) {
  return useQuery({
    queryKey: ['job-postings', cid ?? 'all'],
    queryFn: () => (cid ? fetchJobPostingsByCompany(cid) : fetchJobPostings()),
    staleTime: 30_000,
  });
}
