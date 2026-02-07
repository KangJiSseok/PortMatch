import { Timestamp } from 'firebase/firestore';

export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  createdAt: Timestamp | null;
  type: 'text' | 'interview' | 'system';
  status?: 'sending' | 'error' | 'success';
  interviewId?: string;
  isAccepted?: boolean;
  isDeclined?: boolean;
  jobPostingId?: number;
  jobPostingTitle?: string;
}

export interface ChatRoom {
  id: string;
  participants: string[];
  applicantId: string;
  applicantName: string;
  companyId: string;
  companyName: string;
  lastMessage: string;
  lastUpdatedAt: Timestamp;
  unreadCount: number;
  lastSenderId: string;
  logoUrl: string;
  senderType: 'company' | 'user' | 'system';
  isReadOnly?: boolean;
}

export interface MessengerContextType {
  isOpen: boolean;
  currentRoomId: string | null;
  rooms: ChatRoom[];
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  totalUnreadCount: number;
  areRoomsLoading: boolean;
  areMessagesLoading: boolean;

  toggleMessenger: () => void;
  setCurrentRoomId: (id: string | null) => void;

  sendMessage: (
    text: string,
    type?: 'text' | 'interview' | 'system',
    targetRoomId?: string,
    additionalData?: {
      interviewId?: string | number;
      jobPostingId?: number;
      jobPostingTitle?: string;
    },
  ) => Promise<void>;

  acceptInterview: (messageId: string, interviewId: string, companyName: string) => Promise<void>;
  declineInterview: (messageId: string, interviewId: string, companyName: string) => Promise<void>;

  startNewChat: (
    applicantId: string,
    applicantName: string,
    logoUrl?: string,
  ) => Promise<string | null>;

  sendSystemNotification: (
    targetUserId: string | number,
    messageText: string,
    linkJobId?: number,
    targetType?: 'COMPANY' | 'USER',
  ) => Promise<void>;
}