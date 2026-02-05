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
  setDoc,
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

  const myIdentifier = useMemo(() => {
    if (!user) return null;
    return user.role === 'COMPANY' && user.cid
      ? `COMPANY_${String(user.cid)}`
      : String(user.userId);
  }, [user]);

  useEffect(() => {
    if (!user || !myIdentifier) {
      const timer = setTimeout(() => setRooms([]), 0);
      return () => clearTimeout(timer);
    }

    const currentUserId = String(user.userId);
    const identifiers: string[] = [currentUserId];

    if (user.role === 'COMPANY' && user.cid) {
      identifiers.push(`COMPANY_${String(user.cid)}`);
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

      const userRole = user.role?.toUpperCase();
      const filteredRooms =
        userRole === 'APPLICANT' ? roomData.filter((r) => r.senderType !== 'system') : roomData;

      setRooms(
        filteredRooms.sort((a, b) => b.lastUpdatedAt.toMillis() - a.lastUpdatedAt.toMillis()),
      );
    });

    return () => unsubscribe();
  }, [user, myIdentifier]);

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
      if (!currentRoomId || !isOpen || !myIdentifier) return;
      const currentRoom = rooms.find((r) => r.id === currentRoomId);

      if (currentRoom && currentRoom.lastSenderId !== myIdentifier && currentRoom.unreadCount > 0) {
        try {
          const roomRef = doc(db, 'rooms', currentRoomId);
          await updateDoc(roomRef, { unreadCount: 0 });
        } catch (error) {
          console.error(error);
        }
      }
    };
    markAsRead();
  }, [currentRoomId, messages, isOpen, rooms, myIdentifier]);

  const toggleMessenger = useCallback(() => setIsOpen((prev) => !prev), []);

  const sendMessage = useCallback(
    async (
      text: string,
      type: 'text' | 'interview' | 'system' = 'text',
      targetRoomId?: string,
      additionalData?: { jobPostingId?: number; jobPostingTitle?: string },
    ) => {
      const roomIdToSend = targetRoomId || currentRoomId;
      if (!roomIdToSend || !text.trim()) return;

      try {
        const isSystem = type === 'system';
        const senderId = isSystem ? 'SYSTEM' : myIdentifier || 'UNKNOWN';
        const senderName = isSystem ? 'Giterra 알리미' : user?.name || 'Unknown';

        await addDoc(collection(db, `rooms/${roomIdToSend}/messages`), {
          text,
          senderId,
          senderName,
          createdAt: Timestamp.now(),
          type,
          ...additionalData,
        });

        await updateDoc(doc(db, 'rooms', roomIdToSend), {
          lastMessage: text,
          lastUpdatedAt: Timestamp.now(),
          lastSenderId: senderId,
          unreadCount: increment(1),
        });
      } catch (error) {
        console.error(error);
      }
    },
    [currentRoomId, user, myIdentifier],
  );

  const sendSystemNotification = useCallback(
    async (cid: string | number, messageText: string, linkJobId?: number) => {
      if (!user) return;

      try {
        const companyIdentifier = `COMPANY_${String(cid)}`;
        const roomId = `system_${companyIdentifier}`;

        const roomRef = doc(db, 'rooms', roomId);

        await setDoc(
          roomRef,
          {
            participants: [companyIdentifier, 'SYSTEM', String(user.userId)],
            companyName: 'Giterra 알리미',
            applicantName: '알림 센터',
            lastMessage: messageText,
            lastUpdatedAt: Timestamp.now(),
            lastSenderId: 'SYSTEM',
            unreadCount: increment(1),
            senderType: 'system',
            isReadOnly: true,
            logoUrl: 'https://cdn-icons-png.flaticon.com/512/3602/3602145.png',
          },
          { merge: true },
        );

        await addDoc(collection(db, `rooms/${roomId}/messages`), {
          text: messageText,
          senderId: 'SYSTEM',
          senderName: 'Giterra 알리미',
          createdAt: Timestamp.now(),
          type: 'system',
          jobPostingId: linkJobId || null,
        });
      } catch (error) {
        console.error(error);
      }
    },
    [user],
  );

  const totalUnreadCount = useMemo(
    () =>
      rooms.reduce((acc: number, r: ChatRoom) => {
        if (myIdentifier && r.lastSenderId !== myIdentifier) {
          return acc + (r.unreadCount || 0);
        }
        return acc;
      }, 0),
    [rooms, myIdentifier],
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
        acceptInterview: async () => {},
        declineInterview: async () => {},
        startNewChat: async () => null,
        sendSystemNotification,
      }}
    >
      {children}
    </MessengerContext.Provider>
  );
};
