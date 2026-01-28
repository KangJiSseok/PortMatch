// src/api/stacks.ts
import type { ApiResponse, StackDto } from '@/types/backendJobPosting';

const BASE = import.meta.env.VITE_API_BASE_URL as string;

export async function fetchStacks(): Promise<StackDto[]> {
  const res = await fetch(`${BASE}/api/stacks`);
  if (!res.ok) throw new Error('Failed to fetch stacks');

  const json = (await res.json()) as ApiResponse<StackDto[]>;
  return json.data;
}
