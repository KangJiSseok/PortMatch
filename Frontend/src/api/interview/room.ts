import axiosInstance from '../axiosInstance';

export type InterviewRoomRole = 'INTERVIEWER' | 'APPLICANT';

type CreateRoomResponse = {
  roomId?: string;
};

type PartnerResponse = {
  partnerId?: string | null;
};

export async function createInterviewRoom(scheduleId: number): Promise<string> {
  const res = await axiosInstance.post<CreateRoomResponse>(
    `/interview-rooms/schedules/${scheduleId}`,
  );
  const roomId = res.data?.roomId;
  if (!roomId) {
    throw new Error('roomId를 찾을 수 없습니다.');
  }
  return roomId;
}

export async function registerInterviewPeer(
  roomId: string,
  role: InterviewRoomRole,
  peerId: string,
): Promise<void> {
  await axiosInstance.post(`/interview-rooms/${roomId}/peer`, {
    role,
    peerId,
  });
}

export async function fetchInterviewPartnerPeer(
  roomId: string,
  role: InterviewRoomRole,
): Promise<string | null> {
  const res = await axiosInstance.get<PartnerResponse>(`/interview-rooms/${roomId}/partner`, {
    params: { role },
  });
  return res.data?.partnerId ?? null;
}
