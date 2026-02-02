import { Timestamp } from 'firebase/firestore';

export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  createdAt: Timestamp | null;
  type: 'text' | 'interview';
  status?: 'sending' | 'error' | 'success';
  interviewId?: string;
  isAccepted?: boolean;
  isDeclined?: boolean;
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
  senderType: 'company' | 'user';
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
  declineInterview: (messageId: string, interviewId: string, companyName: string) => Promise<void>;
  startNewChat: (applicantId: string, applicantName: string, logoUrl?: string) => Promise<void>;
}
