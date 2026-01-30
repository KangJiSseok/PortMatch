import type { Timestamp } from 'firebase/firestore';

export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  createdAt: Timestamp;
  type?: 'text' | 'interview';
  interviewId?: string;
  status?: 'sending' | 'sent' | 'error';
  isAccepted?: boolean;
}

export interface ChatRoom {
  id: string;
  name: string;
  lastMessage: string;
  lastUpdatedAt: Timestamp;
  unreadCount: number;
  senderType: 'individual' | 'company';
  companyId?: string;
  logoUrl?: string;
  participants: string[];
}

export interface MessengerContextType {
  isOpen: boolean;
  currentRoomId: string | null;
  rooms: ChatRoom[];
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  totalUnreadCount: number;
  toggleMessenger: () => void;
  setCurrentRoomId: (id: string | null) => void;
  sendMessage: (text: string, type?: 'text' | 'interview', interviewId?: string) => Promise<void>;
  acceptInterview: (messageId: string, interviewId: string, companyName: string) => Promise<void>;
  startNewChat: (applicantId: string, applicantName: string, logoUrl?: string) => Promise<void>;
  refreshMessages: () => Promise<void>;
}
