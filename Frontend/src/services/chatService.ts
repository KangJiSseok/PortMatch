import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  QueryDocumentSnapshot,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: Timestamp | null;
}

export const sendMessage = async (
  roomId: string,
  text: string,
  senderId: string,
): Promise<void> => {
  await addDoc(collection(db, 'chatrooms', roomId, 'messages'), {
    text,
    senderId,
    createdAt: serverTimestamp(),
  });
};

export const subscribeMessages = (roomId: string, callback: (messages: Message[]) => void) => {
  const q = query(collection(db, 'chatrooms', roomId, 'messages'), orderBy('createdAt', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data();
      return {
        id: doc.id,
        text: data.text as string,
        senderId: data.senderId as string,
        createdAt: data.createdAt as Timestamp | null,
      };
    });
    callback(messages);
  });
};
