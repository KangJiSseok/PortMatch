import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  Timestamp,
  where,
  updateDoc,
  doc,
  increment,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { MessengerContext } from './MessengerContext';
import type { Message, ChatRoom } from '../types/messenger';

export const MessengerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  const refreshMessages = useCallback(async () => {
    if (!currentRoomId) return;
    try {
      const q = query(
        collection(db, `rooms/${currentRoomId}/messages`),
        orderBy('createdAt', 'asc'),
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];
      setMessages(data);
    } catch (error) {
      console.error(error);
    }
  }, [currentRoomId]);

  useEffect(() => {
    let isMounted = true;

    const fetchRooms = async () => {
      if (!user) {
        if (isMounted) setRooms([]);
        return;
      }

      try {
        const q = query(
          collection(db, 'rooms'),
          where('participants', 'array-contains', String(user.userId)),
        );
        const snapshot = await getDocs(q);
        if (isMounted) {
          const roomData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as ChatRoom[];
          setRooms(roomData);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchRooms();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const toggleMessenger = useCallback(() => setIsOpen((prev) => !prev), []);

  const startNewChat = useCallback(
    async (applicantId: string, applicantName: string, logoUrl?: string) => {
      if (!user || user.role !== 'COMPANY') return;

      try {
        const roomsRef = collection(db, 'rooms');
        const q = query(roomsRef, where('participants', 'array-contains', String(user.userId)));
        const snapshot = await getDocs(q);

        const existingRoom = snapshot.docs.find((doc) =>
          (doc.data().participants as string[]).includes(applicantId),
        );

        let roomId: string;

        if (existingRoom) {
          roomId = existingRoom.id;
        } else {
          const newRoom = await addDoc(roomsRef, {
            name: applicantName,
            companyName: user.name,
            participants: [String(user.userId), applicantId],
            lastMessage: '새로운 대화가 시작되었습니다.',
            lastUpdatedAt: Timestamp.now(),
            unreadCount: 1,
            senderType: 'company',
            companyId: String(user.userId),
            logoUrl: logoUrl || '',
          });
          roomId = newRoom.id;
        }

        setCurrentRoomId(roomId);
        setIsOpen(true);
      } catch (error) {
        console.error(error);
      }
    },
    [user],
  );

  const sendMessage = useCallback(
    async (text: string, type: 'text' | 'interview' = 'text', interviewId?: string) => {
      if (!currentRoomId || !user || !text.trim()) return;

      const tempId = `temp-${Date.now()}`;
      const tempMsg: Message = {
        id: tempId,
        text,
        senderId: String(user.userId),
        senderName: user.name,
        createdAt: Timestamp.now(),
        type,
        status: 'sending',
        ...(interviewId && { interviewId }),
      };

      setMessages((prev) => [...prev, tempMsg]);

      try {
        await addDoc(collection(db, `rooms/${currentRoomId}/messages`), {
          text,
          senderId: String(user.userId),
          senderName: user.name,
          createdAt: Timestamp.now(),
          type,
          ...(interviewId && { interviewId }),
        });

        await updateDoc(doc(db, 'rooms', currentRoomId), {
          lastMessage: text,
          lastUpdatedAt: Timestamp.now(),
          unreadCount: increment(1),
        });

        await refreshMessages();
      } catch (error) {
        console.error('전송 실패:', error);
        setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, status: 'error' } : m)));
      }
    },
    [currentRoomId, user, refreshMessages],
  );

  useEffect(() => {
    const markAsRead = async () => {
      if (currentRoomId && isOpen) {
        const roomRef = doc(db, 'rooms', currentRoomId);
        await updateDoc(roomRef, {
          unreadCount: 0,
        });
      }
    };

    markAsRead();
  }, [currentRoomId, isOpen]);
  const acceptInterview = useCallback(
    async (messageId: string, interviewId: string, companyName: string) => {
      if (!currentRoomId || !user) return;

      try {
        const confirmText = `[면접 수락]\n${user.name}님이 ${companyName}의 면접 제안을 수락하였습니다.`;

        const messageRef = doc(db, `rooms/${currentRoomId}/messages`, messageId);
        await updateDoc(messageRef, {
          isAccepted: true,
        });

        await sendMessage(confirmText, 'text');

        if (interviewId !== 'pending') {
          const interviewRef = doc(db, 'interviews', interviewId);
          await updateDoc(interviewRef, {
            status: 'ACCEPTED',
            acceptedAt: Timestamp.now(),
          });
        }

        await refreshMessages();
      } catch (error) {
        console.error(error);
      }
    },
    [currentRoomId, user, sendMessage, refreshMessages],
  );

  const totalUnreadCount = useMemo(
    () => rooms.reduce((acc, r) => acc + (r.unreadCount || 0), 0),
    [rooms],
  );

  return (
    <MessengerContext.Provider
      value={{
        isOpen,
        currentRoomId,
        rooms,
        messages,
        setMessages,
        totalUnreadCount,
        toggleMessenger,
        setCurrentRoomId,
        sendMessage,
        acceptInterview,
        startNewChat,
        refreshMessages,
      }}
    >
      {children}
    </MessengerContext.Provider>
  );
};
