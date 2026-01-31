import { useState, useEffect } from 'react';
import { type Message, subscribeMessages, sendMessage } from '../services/chatService';

export const useChat = (roomId: string, userId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = subscribeMessages(roomId, (newMessages: Message[]) => {
      setMessages(newMessages);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [roomId]);

  const send = async (text: string): Promise<void> => {
    if (!text.trim()) return;
    try {
      await sendMessage(roomId, text, userId);
    } catch (error) {
      console.error(error);
    }
  };

  return { messages, isLoading, send };
};