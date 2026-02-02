// src/hooks/useCandidateActions.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  toggleCandidateLike,
  toggleCandidateFollow,
  toggleCandidateScrap,
} from '@/api/company/recommendCandidates';
import type { Candidate } from '@/types/recommendCandidate';

type ParamsKey = {
  q?: string;
  sort?: 'score' | 'recent';
};

function patchList(
  prev: Candidate[] | undefined,
  candidateId: number,
  patch: Partial<Candidate>,
): Candidate[] | undefined {
  if (!prev) return prev;
  return prev.map((c) => (c.id === candidateId ? { ...c, ...patch } : c));
}

export function useCandidateActions(params: ParamsKey) {
  const qc = useQueryClient();
  const key = ['recommendedCandidates', params] as const;

  const likeMutation = useMutation({
    mutationFn: (candidateId: number) => toggleCandidateLike(candidateId),
    onMutate: async (candidateId) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Candidate[]>(key);
      const current = prev?.find((c) => c.id === candidateId);
      qc.setQueryData(key, patchList(prev, candidateId, { liked: !current?.liked }));
      return { prev };
    },
    onError: (_e, _id, ctx) => ctx?.prev && qc.setQueryData(key, ctx.prev),
  });

  const followMutation = useMutation({
    mutationFn: (candidateId: number) => toggleCandidateFollow(candidateId),
    onMutate: async (candidateId) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Candidate[]>(key);
      const current = prev?.find((c) => c.id === candidateId);
      qc.setQueryData(key, patchList(prev, candidateId, { followed: !current?.followed }));
      return { prev };
    },
    onError: (_e, _id, ctx) => ctx?.prev && qc.setQueryData(key, ctx.prev),
  });

  const scrapMutation = useMutation({
    mutationFn: (candidateId: number) => toggleCandidateScrap(candidateId),
    onMutate: async (candidateId) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Candidate[]>(key);
      const current = prev?.find((c) => c.id === candidateId);
      qc.setQueryData(key, patchList(prev, candidateId, { scrapped: !current?.scrapped }));
      return { prev };
    },
    onError: (_e, _id, ctx) => ctx?.prev && qc.setQueryData(key, ctx.prev),
  });

  return { likeMutation, followMutation, scrapMutation };
}
