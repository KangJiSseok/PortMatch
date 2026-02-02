import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  query,
  orderBy,
  addDoc,
  Timestamp,
  where,
  updateDoc,
  doc,
  increment,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { MessengerContext } from './MessengerContext';
import type { Message, ChatRoom } from '../types/messenger';

export const MessengerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!user) {
      const timer = setTimeout(() => setRooms([]), 0);
      return () => clearTimeout(timer);
    }

    const currentUserId = String(user.userId);

    const q = query(
      collection(db, 'rooms'),
      where('participants', 'array-contains', currentUserId),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const roomData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ChatRoom[];
      setRooms(roomData);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!currentRoomId) {
      const timer = setTimeout(() => setMessages([]), 0);
      return () => clearTimeout(timer);
    }

    const q = query(collection(db, `rooms/${currentRoomId}/messages`), orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];
      setMessages(data);
    });

    return () => unsubscribe();
  }, [currentRoomId]);

  useEffect(() => {
    const markAsRead = async () => {
      if (!currentRoomId || !isOpen || !user) return;
      const currentRoom = rooms.find((r) => r.id === currentRoomId);

      if (currentRoom) {
        if (currentRoom.lastSenderId !== String(user.userId) && currentRoom.unreadCount > 0) {
          try {
            const roomRef = doc(db, 'rooms', currentRoomId);
            await updateDoc(roomRef, {
              unreadCount: 0,
            });
          } catch (error) {
            console.error('읽음 처리 중 오류 발생:', error);
          }
        }
      }
    };

    markAsRead();
  }, [currentRoomId, messages, isOpen, rooms, user]);

  const toggleMessenger = useCallback(() => setIsOpen((prev) => !prev), []);

  const startNewChat = useCallback(
    async (applicantId: string, applicantName: string, logoUrl?: string) => {
      if (!user || user.role !== 'COMPANY') return;

      try {
        const currentUserId = String(user.userId);
        const existingRoom = rooms.find((r) => r.participants.includes(applicantId));

        if (existingRoom) {
          setCurrentRoomId(existingRoom.id);
        } else {
          const newRoomData = {
            participants: [currentUserId, applicantId],
            applicantId: applicantId,
            applicantName: applicantName,
            companyId: currentUserId,
            companyName: user.name,
            lastMessage: '새로운 대화가 시작되었습니다.',
            lastUpdatedAt: Timestamp.now(),
            lastSenderId: currentUserId,
            unreadCount: 1,
            senderType: 'company',
            logoUrl: logoUrl || '',
          };

          const docRef = await addDoc(collection(db, 'rooms'), newRoomData);
          setCurrentRoomId(docRef.id);
        }
        setIsOpen(true);
      } catch (error) {
        console.error(error);
      }
    },
    [user, rooms],
  );

  const sendMessage = useCallback(
    async (text: string, type: 'text' | 'interview' = 'text', interviewId?: string) => {
      if (!currentRoomId || !user || !text.trim()) return;

      try {
        const currentUserId = String(user.userId);

        await addDoc(collection(db, `rooms/${currentRoomId}/messages`), {
          text,
          senderId: currentUserId,
          senderName: user.name,
          createdAt: Timestamp.now(),
          type,
          ...(interviewId && { interviewId }),
        });

        await updateDoc(doc(db, 'rooms', currentRoomId), {
          lastMessage: text,
          lastUpdatedAt: Timestamp.now(),
          lastSenderId: String(user.userId),
          unreadCount: increment(1),
        });
      } catch (error) {
        console.error(error);
      }
    },
    [currentRoomId, user],
  );

  const acceptInterview = useCallback(
    async (messageId: string, interviewId: string, companyName: string) => {
      if (!currentRoomId || !user) return;

      try {
        await updateDoc(doc(db, `rooms/${currentRoomId}/messages`, messageId), {
          isAccepted: true,
        });

        const confirmText = `[면접 수락]\n${user.name}님이 ${companyName}의 면접 제안을 수락하였습니다.`;
        await sendMessage(confirmText, 'text');

        if (interviewId !== 'pending') {
          await updateDoc(doc(db, 'interviews', interviewId), {
            status: 'ACCEPTED',
            acceptedAt: Timestamp.now(),
          });
        }
      } catch (error) {
        console.error(error);
      }
    },
    [currentRoomId, user, sendMessage],
  );

  const declineInterview = useCallback(
    async (messageId: string, interviewId: string, companyName: string) => {
      if (!currentRoomId || !user) return;

      try {
        await updateDoc(doc(db, `rooms/${currentRoomId}/messages`, messageId), {
          isDeclined: true,
        });

        const declineText = `[면접 거절]\n${user.name}님이 ${companyName}의 면접 제안을 거절하였습니다.`;
        await sendMessage(declineText, 'text');

        if (interviewId !== 'pending') {
          await updateDoc(doc(db, 'interviews', interviewId), {
            status: 'REJECTED',
          });
        }
      } catch (error) {
        console.error(error);
      }
    },
    [currentRoomId, user, sendMessage],
  );

  const totalUnreadCount = useMemo(
    () =>
      rooms.reduce((acc, r) => {
        if (r.lastSenderId !== String(user?.userId)) {
          return acc + (r.unreadCount || 0);
        }
        return acc;
      }, 0),
    [rooms, user?.userId],
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
        declineInterview,
        startNewChat,
      }}
    >
      {children}
    </MessengerContext.Provider>
  );
};
