import axiosInstance from '@/api/axiosInstance';
import type { ApiEnvelope } from '@/api/myPage/types';

export type CreateInterviewScheduleBody = {
  time: string;
  status: 'PENDING' | 'CONFIRMED' | 'APPROVED' | 'CANCELED' | 'COMPLETED';
  user: {
    userId: number;
  };
  jobPosting: {
    id: number;
  };
};

export async function createInterviewSchedule(
  body: CreateInterviewScheduleBody,
): Promise<number> {
  const res = await axiosInstance.post<number | ApiEnvelope<number>>('/interviews', body);
  const payload = res.data;

  if (typeof payload === 'number') {
    return payload;
  }

  // Handle wrapped response (e.g. { status: true, data: 123 })
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const data = (payload as ApiEnvelope<number>).data;
    if (typeof data === 'number') return data;
  }

  throw new Error('Failed to create interview schedule: Invalid response');
}
