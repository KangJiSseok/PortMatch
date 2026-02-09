// src/hooks/useStacks.ts
import { useQuery } from '@tanstack/react-query';
import { fetchStacks } from '@/api/stacks';

export function useStacks() {
  return useQuery({
    queryKey: ['stacks'],
    queryFn: fetchStacks,
    staleTime: 1000 * 60 * 10, // 10분 캐싱
  });
}
