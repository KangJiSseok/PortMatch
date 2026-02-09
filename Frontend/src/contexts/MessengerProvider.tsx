import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  collection,
  query,
  orderBy,
  addDoc,
  Timestamp,
  where,
  updateDoc,
  doc,
  setDoc,
  increment,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { MessengerContext } from './MessengerContext';
import type { Message, ChatRoom } from '../types/messenger';
import SystemIcon from '../assets/images/system/alarm.png';

interface ExtendedUser {
  userId: number | string;
  role: string;
  cid?: number | string;
  companyId?: number | string;
  [key: string]: any;
}

export const MessengerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthStore();
  const safeUser = user as ExtendedUser | null;

  const [isOpen, setIsOpen] = useState(false);

  const [areRoomsLoading, setAreRoomsLoading] = useState<boolean>(!!user);
  const [areMessagesLoading, setAreMessagesLoading] = useState<boolean>(false);

  const [currentRoomId, _setCurrentRoomId] = useState<string | null>(null);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  const unsubscribeRoomsRef = useRef<(() => void) | null>(null);
  const unsubscribeMessagesRef = useRef<(() => void) | null>(null);

  const setCurrentRoomId = useCallback((id: string | null) => {
    if (id) {
      setAreMessagesLoading(true);
      setMessages([]);
    }
    _setCurrentRoomId(id);
  }, []);

  const myIdentifier = useMemo(() => {
    if (!safeUser || !safeUser.userId) return null;

    if (safeUser.role === 'COMPANY') {
      if (safeUser.cid) {
        return `COMPANY_${String(safeUser.cid)}`;
      }
      if (safeUser.companyId) {
        return `COMPANY_${String(safeUser.companyId)}`;
      }
      return String(safeUser.userId);
    }

    return String(safeUser.userId);
  }, [safeUser]);

  useEffect(() => {
    if (unsubscribeRoomsRef.current) {
      unsubscribeRoomsRef.current();
      unsubscribeRoomsRef.current = null;
    }

    if (safeUser && !myIdentifier) {
      setAreRoomsLoading(false);
      return;
    }

    if (!myIdentifier) {
      setRooms([]);
      setAreRoomsLoading(false);
      return;
    }

    setAreRoomsLoading(true);

    const identifiers: (string | number)[] = [myIdentifier];

    if (safeUser?.userId) {
      const uidStr = String(safeUser.userId);
      const uidNum = Number(safeUser.userId);
      if (!identifiers.includes(uidStr)) identifiers.push(uidStr);
      if (!identifiers.includes(uidNum)) identifiers.push(uidNum);
    }

    const q = query(
      collection(db, 'rooms'),
      where('participants', 'array-contains-any', identifiers),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const roomData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ChatRoom[];

      const userRole = safeUser?.role?.toUpperCase();
      const filteredRooms =
        userRole === 'APPLICANT'
          ? roomData.filter((r) => r.senderType !== 'system' || r.lastMessage)
          : roomData;

      const sortedRooms = filteredRooms.sort((a, b) => {
        const tA = a.lastUpdatedAt?.toMillis() || 0;
        const tB = b.lastUpdatedAt?.toMillis() || 0;
        return tB - tA;
      });

      setRooms(sortedRooms);
      setAreRoomsLoading(false);
    }, (error) => {
      console.error("[Messenger] Rooms fetch error:", error);
      setAreRoomsLoading(false);
    });

    unsubscribeRoomsRef.current = unsubscribe;

    return () => {
      if (unsubscribeRoomsRef.current) unsubscribeRoomsRef.current();
    };
  }, [myIdentifier, safeUser]);

  useEffect(() => {
    if (unsubscribeMessagesRef.current) {
      unsubscribeMessagesRef.current();
      unsubscribeMessagesRef.current = null;
    }

    if (!currentRoomId) {
      setMessages([]);
      setAreMessagesLoading(false);
      return;
    }

    setAreMessagesLoading(true);

    const q = query(collection(db, `rooms/${currentRoomId}/messages`), orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];

      setMessages(data);
      setAreMessagesLoading(false);
    }, (error) => {
      console.error("[Messenger] Messages fetch error:", error);
      setAreMessagesLoading(false);
    });

    unsubscribeMessagesRef.current = unsubscribe;

    return () => {
      if (unsubscribeMessagesRef.current) unsubscribeMessagesRef.current();
    };
  }, [currentRoomId]);

  useEffect(() => {
    const markAsRead = async () => {
      if (!currentRoomId || !isOpen || !myIdentifier || rooms.length === 0) return;
      const currentRoom = rooms.find((r) => r.id === currentRoomId);
      if (currentRoom && currentRoom.lastSenderId !== myIdentifier && currentRoom.unreadCount > 0) {
        try {
          const roomRef = doc(db, 'rooms', currentRoomId);
          await updateDoc(roomRef, { unreadCount: 0 });
        } catch (error) { console.error(error); }
      }
    };
    markAsRead();
  }, [currentRoomId, messages, isOpen, rooms, myIdentifier]);

  const toggleMessenger = useCallback(() => setIsOpen((prev) => !prev), []);

  const startNewChat = useCallback(async (targetUserId: string, targetName: string, targetProfileImg?: string) => {
    if (!safeUser || !myIdentifier) return null;
    try {
      const existingRoom = rooms.find(
        (r) => r.participants.includes(targetUserId) && r.participants.includes(myIdentifier),
      );
      if (existingRoom) {
        setCurrentRoomId(existingRoom.id);
        setIsOpen(true);
        return existingRoom.id;
      }
      const isCompany = safeUser.role === 'COMPANY';
      const newRoomData = {
        participants: [myIdentifier, targetUserId],
        companyName: isCompany ? safeUser.name || '기업' : targetName,
        applicantName: isCompany ? targetName : safeUser.name || '지원자',
        lastMessage: '대화를 시작해보세요!',
        lastUpdatedAt: Timestamp.now(),
        lastSenderId: 'SYSTEM',
        unreadCount: 0,
        senderType: 'general',
        logoUrl: targetProfileImg || '',
      };
      const docRef = await addDoc(collection(db, 'rooms'), newRoomData);
      setCurrentRoomId(docRef.id);
      setIsOpen(true);
      return docRef.id;
    } catch (error) {
      console.error(error);
      return null;
    }
  }, [safeUser, myIdentifier, rooms]);

  const sendMessage = useCallback(async (text: string, type: 'text' | 'interview' | 'system' = 'text', targetRoomId?: string, additionalData?: any) => {
    const roomIdToSend = targetRoomId || currentRoomId;
    if (!roomIdToSend || !text.trim()) return;
    try {
      const isSystem = type === 'system';
      const senderId = isSystem ? 'SYSTEM' : myIdentifier || 'UNKNOWN';
      const senderName = isSystem ? 'PortMatch 알리미' : safeUser?.name || 'Unknown';
      const payload: Record<string, any> = {
        text, senderId, senderName, createdAt: Timestamp.now(), type,
      };
      if (additionalData) {
        if (additionalData.jobPostingId !== undefined) payload.jobPostingId = additionalData.jobPostingId;
        if (additionalData.jobPostingTitle !== undefined) payload.jobPostingTitle = additionalData.jobPostingTitle;
        if (additionalData.interviewId !== undefined) payload.interviewId = additionalData.interviewId;
      }
      await addDoc(collection(db, `rooms/${roomIdToSend}/messages`), payload);
      await updateDoc(doc(db, 'rooms', roomIdToSend), {
        lastMessage: text,
        lastUpdatedAt: Timestamp.now(),
        lastSenderId: senderId,
        unreadCount: increment(1),
      });
    } catch (error) { console.error(error); }
  }, [currentRoomId, safeUser, myIdentifier]);

  const sendSystemNotification = useCallback(async (targetId: string | number, messageText: string, linkJobId?: number, targetType: 'COMPANY' | 'USER' = 'COMPANY') => {
    if (!targetId) return;
    try {
      const strId = String(targetId).trim();
      const targetIdentifier = targetType === 'COMPANY' ? `COMPANY_${strId}` : strId;
      const roomId = `system_${targetIdentifier}`;
      const roomRef = doc(db, 'rooms', roomId);
      await setDoc(roomRef, {
        participants: [targetIdentifier, 'SYSTEM'],
        companyName: 'PortMatch 알리미',
        applicantName: '알림 센터',
        lastMessage: messageText,
        lastUpdatedAt: Timestamp.now(),
        lastSenderId: 'SYSTEM',
        unreadCount: increment(1),
        senderType: 'system',
        isReadOnly: true,
        logoUrl: SystemIcon,
      }, { merge: true });
      const payload: any = {
        text: messageText,
        senderId: 'SYSTEM',
        senderName: 'PortMatch 알리미',
        createdAt: Timestamp.now(),
        type: 'system',
      };
      if (linkJobId) payload.jobPostingId = linkJobId;
      await addDoc(collection(db, `rooms/${roomId}/messages`), payload);
    } catch (error) { console.error(error); }
  }, []);

  const acceptInterview = async (messageId: string) => {
    if (!currentRoomId) return;
    try { await updateDoc(doc(db, 'rooms', currentRoomId, 'messages', messageId), { isAccepted: true, isDeclined: false }); } catch (error) { console.error(error); }
  };

  const declineInterview = async (messageId: string) => {
    if (!currentRoomId) return;
    try { await updateDoc(doc(db, 'rooms', currentRoomId, 'messages', messageId), { isAccepted: false, isDeclined: true }); } catch (error) { console.error(error); }
  };

  const totalUnreadCount = useMemo(() =>
    rooms.reduce((acc: number, r: ChatRoom) => {
      if (myIdentifier && r.lastSenderId !== myIdentifier) {
        return acc + (r.unreadCount || 0);
      }
      return acc;
    }, 0), [rooms, myIdentifier]);

  return (
    <MessengerContext.Provider
      value={{
        isOpen, currentRoomId, rooms, messages, setMessages, totalUnreadCount,
        areRoomsLoading, areMessagesLoading,
        toggleMessenger, setCurrentRoomId, sendMessage,
        acceptInterview, declineInterview, startNewChat, sendSystemNotification,
      }}
    >
      {children}
    </MessengerContext.Provider>
  );
};