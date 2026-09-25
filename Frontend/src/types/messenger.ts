export interface TimeValue { toDate(): Date; toMillis(): number }
export const timeValue = (value?: string | null): TimeValue | null => {
  if (!value) return null;
  const date = new Date(value);
  return { toDate: () => date, toMillis: () => date.getTime() };
};
export interface Message {
  id: string; roomId?: string; roomSequence: number; text: string; senderId: string;
  senderName: string; createdAt: TimeValue | null; type: 'text' | 'interview' | 'system';
  status?: 'sending' | 'error' | 'success'; interviewId?: string; isAccepted?: boolean;
  isDeclined?: boolean; jobPostingId?: number; jobPostingTitle?: string;
}
export interface ChatRoom {
  id: string; roomType: 'DIRECT' | 'SYSTEM'; participants: string[]; applicantId: string;
  applicantName: string; companyId: string; companyName: string; lastMessage: string;
  lastUpdatedAt: TimeValue | null; unreadCount: number; lastReadSequence: number;
  lastSenderId: string; logoUrl: string; senderType: 'company' | 'user' | 'system'; isReadOnly?: boolean;
}
export interface MessengerContextType {
  isOpen: boolean; currentRoomId: string | null; rooms: ChatRoom[]; messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>; totalUnreadCount: number;
  areRoomsLoading: boolean; areMessagesLoading: boolean; toggleMessenger: () => void;
  setCurrentRoomId: (id: string | null) => void;
  sendMessage: (text: string, type?: 'text' | 'interview' | 'system', targetRoomId?: string,
    additionalData?: { interviewId?: string | number; jobPostingId?: number; jobPostingTitle?: string }) => Promise<void>;
  acceptInterview: (messageId: string, interviewId: string, companyName: string) => Promise<void>;
  declineInterview: (messageId: string, interviewId: string, companyName: string) => Promise<void>;
  startNewChat: (applicantId: string, applicantName: string, logoUrl?: string) => Promise<string | null>;
  sendSystemNotification: (targetUserId: string | number, messageText: string, linkJobId?: number,
    targetType?: 'COMPANY' | 'USER') => Promise<void>;
}
