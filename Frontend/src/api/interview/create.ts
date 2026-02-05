import axiosInstance from '../axiosInstance';

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
  const res = await axiosInstance.post<number>('/interviews', body);
  return res.data;
}
