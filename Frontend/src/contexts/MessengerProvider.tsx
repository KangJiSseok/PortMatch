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
  getDocs,
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
    async (
      applicantId: string,
      applicantName: string,
      logoUrl?: string,
    ): Promise<string | null> => {
      if (!user || user.role !== 'COMPANY') return null;

      try {
        const currentUserId = String(user.userId);
        const existingRoom = rooms.find((r) => r.participants.includes(applicantId));

        let targetRoomId = '';

        if (existingRoom) {
          targetRoomId = existingRoom.id;
          setCurrentRoomId(targetRoomId);
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
          targetRoomId = docRef.id;
          setCurrentRoomId(targetRoomId);
        }
        setIsOpen(true);

        return targetRoomId;
      } catch (error) {
        console.error(error);
        return null;
      }
    },
    [user, rooms],
  );

  const sendMessage = useCallback(
    async (
      text: string,
      type: 'text' | 'interview' | 'system' = 'text',
      targetRoomId?: string,
      additionalData?: {
        interviewId?: string;
        jobPostingId?: number;
        jobPostingTitle?: string;
      },
    ) => {
      const roomIdToSend = targetRoomId || currentRoomId;

      if (!roomIdToSend) return;

      try {
        const currentUserId = user ? String(user.userId) : 'SYSTEM';
        const currentUserName = user ? user.name : 'Giterra 알리미';

        await addDoc(collection(db, `rooms/${roomIdToSend}/messages`), {
          text,
          senderId: currentUserId,
          senderName: currentUserName,
          createdAt: Timestamp.now(),
          type,
          ...additionalData,
        });

        await updateDoc(doc(db, 'rooms', roomIdToSend), {
          lastMessage: text,
          lastUpdatedAt: Timestamp.now(),
          lastSenderId: currentUserId,
          unreadCount: increment(1),
        });
      } catch (error) {
        console.error(error);
      }
    },
    [currentRoomId, user],
  );

  const getOrCreateSystemRoom = useCallback(async (targetUserId: string) => {
    try {
      const q = query(
        collection(db, 'rooms'),
        where('participants', 'array-contains', targetUserId),
      );
      const snapshot = await getDocs(q);

      const systemRoom = snapshot.docs.find((doc) => doc.data().participants.includes('SYSTEM'));

      if (systemRoom) {
        return systemRoom.id;
      }

      const newRoomData = {
        participants: [targetUserId, 'SYSTEM'],
        applicantId: targetUserId,
        applicantName: '사용자',
        companyId: 'SYSTEM',
        companyName: 'Giterra 알리미',
        lastMessage: '새로운 알림이 도착했습니다.',
        lastUpdatedAt: Timestamp.now(),
        lastSenderId: 'SYSTEM',
        unreadCount: 1,
        senderType: 'system',
        logoUrl: 'https://cdn-icons-png.flaticon.com/512/3602/3602145.png',
        isReadOnly: true,
      };

      const docRef = await addDoc(collection(db, 'rooms'), newRoomData);
      return docRef.id;
    } catch (error) {
      console.error('시스템 방 생성 실패:', error);
      return null;
    }
  }, []);

  const sendSystemNotification = useCallback(
    async (targetUserId: string, messageText: string, linkJobId?: number) => {
      try {
        const roomId = await getOrCreateSystemRoom(targetUserId);
        if (!roomId) return;

        await sendMessage(
          messageText,
          'system',
          roomId,
          linkJobId ? { jobPostingId: linkJobId } : undefined,
        );
      } catch (error) {
        console.error('알림 전송 실패:', error);
      }
    },
    [getOrCreateSystemRoom, sendMessage],
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
        sendSystemNotification,
      }}
    >
      {children}
    </MessengerContext.Provider>
  );
};
