// src/api/myPage/interviews.ts
import { isAxiosError } from 'axios';
import axiosInstance from '@/api/axiosInstance';
import { getMyInfo } from '@/api/auth';
import type { ApiEnvelope } from './types';

export type InterviewUserApi = {
  userId?: number;
  email?: string;
  name?: string;
  role?: string;
  cid?: string | null;
};

export type JobPostingApi = {
  id?: number;
  title?: string;
  active?: number;
  startDate?: string;
  endDate?: string | null;
  vcnt?: number;
  cid?: string | null;
  detail?: string;
  jobType?: number | string;
  stackIds?: number[] | string[] | null;
  companyName?: string;
  company?: {
    name?: string;
    companies_name?: string;
    corpName?: string;
    companyName?: string;
  } | null;
  companies_name?: string;
  corpName?: string;
};

export type InterviewApiRow = {
  id: number;
  time?: string | null;
  scheduledAt?: string | null;
  scheduled_at?: string | null;
  status?: string | null;
  userId?: number | null;
  user?: InterviewUserApi | null;
  jobPostingId?: number | null;
  job_posting_id?: number | null;
  jobPosting?: JobPostingApi | null;
  roomId?: string | null;
  room_id?: string | null;
  applicationId?: number | null;
  application_id?: number | null;
};

function extractApiMessage(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) return null;

  const maybeMessage = (payload as { message?: unknown }).message;
  if (typeof maybeMessage === 'string' && maybeMessage.trim().length > 0) return maybeMessage;

  return null;
}

function normalizeError(err: unknown, fallback: string): Error {
  if (isAxiosError(err)) {
    const apiMsg = extractApiMessage(err.response?.data);
    const msg = apiMsg ?? err.message ?? fallback;
    return new Error(msg);
  }

  if (err instanceof Error) return err;
  return new Error(fallback);
}

function normalizeInterviewRows(payload: unknown): InterviewApiRow[] {
  if (Array.isArray(payload)) return payload as InterviewApiRow[];

  if (payload && typeof payload === 'object') {
    const data = (payload as ApiEnvelope<InterviewApiRow[]>).data;
    if (Array.isArray(data)) return data;
  }

  return [];
}

export async function fetchInterviewRowsByUserId(userId: number): Promise<InterviewApiRow[]> {
  try {
    const res = await axiosInstance.get(`/interviews/user/${userId}`);
    return normalizeInterviewRows(res.data);
  } catch (err) {
    throw normalizeError(err, 'Failed to fetch interview schedules.');
  }
}

export async function fetchInterviewRowsForMe(): Promise<InterviewApiRow[]> {
  const me = await getMyInfo();
  const userId = me?.data?.userId;

  if (typeof userId !== 'number' || !Number.isFinite(userId)) {
    throw new Error('Failed to resolve current user id.');
  }

  return fetchInterviewRowsByUserId(userId);
}
