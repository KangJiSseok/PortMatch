// src/api/myPage/scraps.ts
import { isAxiosError } from 'axios';
import axiosInstance from '@/api/axiosInstance';
import { getMyInfo } from '@/api/auth';
import type { ApiEnvelope, CompanyScrapRowApi, ScrapRowApi } from './types';

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

export async function fetchMyScrapRows(uid: number): Promise<ScrapRowApi[]> {
  try {
    const res = await axiosInstance.get<ApiEnvelope<ScrapRowApi[]>>(`/scraps/${uid}`);
    return res.data.data ?? [];
  } catch (err) {
    throw normalizeError(err, 'Failed to fetch scrap list.');
  }
}

export async function fetchMyCompanyScrapRows(uid: number): Promise<CompanyScrapRowApi[]> {
  try {
    const res = await axiosInstance.get<ApiEnvelope<CompanyScrapRowApi[]>>(
      `/company-scraps/${uid}`,
    );
    return res.data.data ?? [];
  } catch (err) {
    throw normalizeError(err, 'Failed to fetch company scrap list.');
  }
}

export async function fetchMyScrapRowsForMe(): Promise<ScrapRowApi[]> {
  const me = await getMyInfo();
  const userId = me?.data?.userId;

  if (typeof userId !== 'number' || !Number.isFinite(userId)) {
    throw new Error('Failed to resolve current user id.');
  }

  return fetchMyScrapRows(userId);
}

export async function fetchMyCompanyScrapRowsForMe(): Promise<CompanyScrapRowApi[]> {
  const me = await getMyInfo();
  const userId = me?.data?.userId;

  if (typeof userId !== 'number' || !Number.isFinite(userId)) {
    throw new Error('Failed to resolve current user id.');
  }

  return fetchMyCompanyScrapRows(userId);
}
