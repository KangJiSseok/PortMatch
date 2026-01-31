import { Timestamp } from 'firebase/firestore';
import type { ChatRoom } from '../types/messenger';

export const INITIAL_ROOMS: ChatRoom[] = [
  {
    id: 'samsung',
    name: '삼성전자 채용담당자',
    lastMessage: '포트폴리오가 인상 깊어 연락드렸습니다.',
    lastUpdatedAt: Timestamp.fromDate(new Date('2026-01-30T09:30:00')),
    unreadCount: 1,
    senderType: 'company',
    companyId: '12345',
    logoUrl: 'https://logo.clearbit.com/samsung.com',
    participants: ['samsung_id', '1'],
  },
  {
    id: 'portmatch',
    name: 'Portmatch 운영팀',
    lastMessage: '신규 기능 업데이트 안내',
    lastUpdatedAt: Timestamp.fromDate(new Date('2026-01-28T08:00:00')),
    unreadCount: 0,
    senderType: 'individual',
    participants: ['admin_id', '1'],
  },
];
