// src/api/jobPost/scrap.ts
import { isAxiosError } from 'axios';
import axiosInstance from '@/api/axiosInstance';

type ApiEnvelope<T> = {
  code: number | string;
  message: string;
  data: T | null;
};

export type ScrapRowApi = {
  id: number;
  uid: number;
  pid: string;
  createdAt: string;
};

function extractApiMessage(payload: unknown): string | null {
  // payload가 { message: string } 형태일 때만 message를 꺼내기
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

/** 스크랩 여부 확인: GET /api/scraps/check?uid=&pid= */
export async function fetchScrapCheck(uid: number, pid: string): Promise<boolean> {
  try {
    const res = await axiosInstance.get<ApiEnvelope<boolean>>('/scraps/check', {
      params: { uid, pid },
    });

    if (typeof res.data.data === 'boolean') return res.data.data;
    throw new Error(res.data.message || '스크랩 여부 확인 실패');
  } catch (err) {
    throw normalizeError(err, '스크랩 여부 확인 실패');
  }
}

/** 내 스크랩 목록 조회: GET /api/scraps/{uid} */
export async function fetchMyScrapRows(uid: number): Promise<ScrapRowApi[]> {
  try {
    const res = await axiosInstance.get<ApiEnvelope<ScrapRowApi[]>>(`/scraps/${uid}`);
    return res.data.data ?? [];
  } catch (err) {
    throw normalizeError(err, '스크랩 목록 조회 실패');
  }
}

/** 스크랩 토글: POST /api/scraps?uid=&pid= */
export async function toggleScrap(uid: number, pid: string): Promise<boolean> {
  try {
    const res = await axiosInstance.post<ApiEnvelope<boolean>>('/scraps', null, {
      params: { uid, pid },
    });

    if (typeof res.data.data === 'boolean') return res.data.data;
    throw new Error(res.data.message || '스크랩 토글 실패');
  } catch (err) {
    throw normalizeError(err, '스크랩 토글 실패');
  }
}
