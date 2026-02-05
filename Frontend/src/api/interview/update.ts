// src/api/interview/update.ts
import { isAxiosError } from 'axios';
import axiosInstance from '@/api/axiosInstance';
import type { ApiEnvelope } from '@/api/myPage/types';
import type { InterviewCompanyApiRow } from './company';

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

function normalizeRow(payload: unknown): InterviewCompanyApiRow | null {
  if (!payload || typeof payload !== 'object') return null;

  if ('data' in (payload as { data?: unknown })) {
    const data = (payload as ApiEnvelope<InterviewCompanyApiRow>).data;
    if (data && typeof data === 'object') return data as InterviewCompanyApiRow;
  }

  return payload as InterviewCompanyApiRow;
}

export type UpdateInterviewScheduleBody = {
  time?: string;
  status?: 'PENDING' | 'CONFIRMED' | 'APPROVED' | 'CANCELED' | 'COMPLETED';
};

export async function updateInterviewSchedule(
  scheduleId: number,
  body: UpdateInterviewScheduleBody,
): Promise<InterviewCompanyApiRow | null> {
  try {
    const res = await axiosInstance.put(`/interviews/${scheduleId}`, body);
    return normalizeRow(res.data);
  } catch (err) {
    throw normalizeError(err, 'Failed to update interview schedule.');
  }
}
