import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import { useAuthStore } from '../store/authStore';
import { MessengerContext } from './MessengerContext';
import type { ChatRoom, Message } from '../types/messenger';
import { timeValue } from '../types/messenger';
import { createChatRoom, fetchChatMessages, fetchChatRooms, markChatRead, postChatMessage,
  type ApiMessage, type ApiRoom } from '../api/messenger';

const toMessage = (m: ApiMessage): Message => ({
  id: m.id, roomId: m.roomId, roomSequence: m.roomSequence, text: m.content,
  senderId: m.senderId == null ? 'SYSTEM' : String(m.senderId),
  senderName: m.senderName || (m.senderId == null ? 'PortMatch 알리미' : 'Unknown'),
  createdAt: timeValue(m.createdAt), type: m.messageType.toLowerCase() as Message['type'],
  interviewId: m.interviewId == null ? undefined : String(m.interviewId),
  jobPostingId: m.jobPostingId, jobPostingTitle: m.jobPostingTitle,
});
const toRoom = (r: ApiRoom): ChatRoom => ({
  id: r.id, roomType: r.roomType,
  participants: r.roomType === 'SYSTEM' ? ['SYSTEM'] : [String(r.companyId), String(r.applicantId)],
  companyId: r.companyId == null ? '' : String(r.companyId),
  companyName: r.roomType === 'SYSTEM' ? 'PortMatch 알리미' : r.companyName || '기업',
  applicantId: r.applicantId == null ? '' : String(r.applicantId),
  applicantName: r.roomType === 'SYSTEM' ? '알림 센터' : r.applicantName || '지원자',
  lastMessage: r.lastMessage || '대화를 시작해보세요!', lastUpdatedAt: timeValue(r.lastUpdatedAt),
  unreadCount: r.unreadCount, lastReadSequence: r.lastReadSequence,
  lastSenderId: r.lastSenderId == null ? 'SYSTEM' : String(r.lastSenderId), logoUrl: '',
  senderType: r.roomType === 'SYSTEM' ? 'system' : 'company', isReadOnly: r.roomType === 'SYSTEM',
});
const mergeMessages = (current: Message[], incoming: Message[]) =>
  [...new Map([...current, ...incoming].map((message) => [message.id, message])).values()]
    .sort((a, b) => a.roomSequence - b.roomSequence);

export const MessengerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [areRoomsLoading, setAreRoomsLoading] = useState(Boolean(user));
  const [areMessagesLoading, setAreMessagesLoading] = useState(false);
  const [currentRoomId, setRoomId] = useState<string | null>(null);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const stomp = useRef<Client | null>(null);
  const subscription = useRef<StompSubscription | null>(null);
  const [connected, setConnected] = useState(false);

  const loadRooms = useCallback(async () => {
    if (!user) { setRooms([]); setAreRoomsLoading(false); return; }
    try { setRooms((await fetchChatRooms()).map(toRoom)); }
    finally { setAreRoomsLoading(false); }
  }, [user]);
  useEffect(() => { void loadRooms(); }, [loadRooms]);
  const setCurrentRoomId = useCallback((id: string | null) => {
    setMessages([]); setAreMessagesLoading(Boolean(id)); setRoomId(id);
  }, []);

  useEffect(() => {
    if (!user) return;
    const scheme = location.protocol === 'https:' ? 'wss' : 'ws';
    const client = new Client({ brokerURL: `${scheme}://${location.host}/ws/chat`, reconnectDelay: 2000,
      onConnect: () => setConnected(true), onDisconnect: () => setConnected(false),
      onWebSocketClose: () => setConnected(false) });
    stomp.current = client; client.activate();
    return () => { subscription.current?.unsubscribe(); void client.deactivate(); stomp.current = null; };
  }, [user]);

  useEffect(() => {
    subscription.current?.unsubscribe(); subscription.current = null;
    if (!currentRoomId) { setAreMessagesLoading(false); return; }
    let cancelled = false;
    void fetchChatMessages(currentRoomId).then((rows) => {
      if (!cancelled) { setMessages(rows.map(toMessage)); setAreMessagesLoading(false); }
    });
    if (connected && stomp.current) subscription.current = stomp.current.subscribe(
      `/topic/chat.rooms.${currentRoomId}`, (frame: IMessage) => {
        const event = JSON.parse(frame.body) as { messageId: string; roomId: string; roomSequence: number;
          senderId?: number; content: string; messageType: ApiMessage['messageType']; occurredAt: string;
          interviewId?: number; jobPostingId?: number; jobPostingTitle?: string };
        setMessages((old) => mergeMessages(old, [toMessage({ id: event.messageId, roomId: event.roomId,
          roomSequence: event.roomSequence, senderId: event.senderId, senderName: '', content: event.content,
          messageType: event.messageType, createdAt: event.occurredAt, interviewId: event.interviewId,
          jobPostingId: event.jobPostingId, jobPostingTitle: event.jobPostingTitle })]));
        void loadRooms();
      });
    return () => { cancelled = true; subscription.current?.unsubscribe(); subscription.current = null; };
  }, [connected, currentRoomId, loadRooms]);

  useEffect(() => {
    if (!isOpen || !currentRoomId || messages.length === 0) return;
    void markChatRead(currentRoomId, messages.at(-1)?.roomSequence ?? 0).then(loadRooms);
  }, [currentRoomId, isOpen, loadRooms, messages]);

  const startNewChat = useCallback(async (targetUserId: string) => {
    try { const room = toRoom(await createChatRoom(Number(targetUserId))); await loadRooms();
      setCurrentRoomId(room.id); setIsOpen(true); return room.id;
    } catch (error) { console.error(error); return null; }
  }, [loadRooms, setCurrentRoomId]);
  const sendMessage = useCallback(async (text: string, type: 'text' | 'interview' | 'system' = 'text',
    targetRoomId?: string, data?: { interviewId?: string | number; jobPostingId?: number; jobPostingTitle?: string }) => {
    const roomId = targetRoomId || currentRoomId;
    if (!roomId || !text.trim() || type === 'system') return;
    const row = await postChatMessage(roomId, { clientMessageId: crypto.randomUUID(), content: text.trim(),
      messageType: type.toUpperCase(), interviewId: data?.interviewId, jobPostingId: data?.jobPostingId,
      jobPostingTitle: data?.jobPostingTitle });
    setMessages((old) => mergeMessages(old, [toMessage(row)])); await loadRooms();
  }, [currentRoomId, loadRooms]);
  const totalUnreadCount = useMemo(() => rooms.reduce((sum, room) => sum + room.unreadCount, 0), [rooms]);
  const noop = useCallback(async () => {}, []);
  return <MessengerContext.Provider value={{ isOpen, currentRoomId, rooms, messages, setMessages,
    totalUnreadCount, areRoomsLoading, areMessagesLoading, toggleMessenger: () => setIsOpen((v) => !v),
    setCurrentRoomId, sendMessage, startNewChat, acceptInterview: noop, declineInterview: noop,
    sendSystemNotification: noop }}>{children}</MessengerContext.Provider>;
};
