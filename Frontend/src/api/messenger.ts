import axiosInstance from './axiosInstance';
export interface ApiRoom {
  id: string; roomType: 'DIRECT' | 'SYSTEM'; companyId?: number; companyName?: string;
  applicantId?: number; applicantName?: string; lastMessage?: string; lastSenderId?: number;
  lastUpdatedAt?: string; unreadCount: number; lastReadSequence: number;
}
export interface ApiMessage {
  id: string; roomId: string; roomSequence: number; senderId?: number; senderName: string;
  content: string; messageType: 'TEXT' | 'INTERVIEW' | 'SYSTEM'; createdAt: string;
  interviewId?: number; jobPostingId?: number; jobPostingTitle?: string;
}
interface Envelope<T> { data: T }
export const fetchChatRooms = async () => (await axiosInstance.get<Envelope<ApiRoom[]>>('/chat/rooms')).data.data;
export const createChatRoom = async (targetUserId: number) =>
  (await axiosInstance.post<Envelope<ApiRoom>>('/chat/rooms', { targetUserId })).data.data;
export const fetchChatMessages = async (roomId: string, afterSequence = 0) =>
  (await axiosInstance.get<Envelope<ApiMessage[]>>(`/chat/rooms/${roomId}/messages`, { params: { afterSequence, limit: 200 } })).data.data;
export const postChatMessage = async (roomId: string, body: Record<string, unknown>) =>
  (await axiosInstance.post<Envelope<ApiMessage>>(`/chat/rooms/${roomId}/messages`, body)).data.data;
export const markChatRead = (roomId: string, roomSequence: number) =>
  axiosInstance.patch(`/chat/rooms/${roomId}/read`, { roomSequence });
export const initiateChatByCompany = async (_companyId: number, _companyName: string, applicantId: string) =>
  (await createChatRoom(Number(applicantId))).id;
