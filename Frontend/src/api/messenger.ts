import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

export const initiateChatByCompany = async (
  companyId: number,
  companyName: string,
  applicantId: string,
  applicantName: string,
  logoUrl?: string,
) => {
  const roomsRef = collection(db, 'rooms');

  const q = query(roomsRef, where('participants', 'array-contains', String(companyId)));

  const snapshot = await getDocs(q);
  const existingRoom = snapshot.docs.find((doc) =>
    (doc.data().participants as string[]).includes(applicantId),
  );

  if (existingRoom) {
    return existingRoom.id;
  }

  const newRoom = await addDoc(roomsRef, {
    name: applicantName,
    companyName: companyName,
    participants: [String(companyId), applicantId],
    lastMessage: '기업으로부터 새로운 쪽지가 도착했습니다.',
    lastUpdatedAt: Timestamp.now(),
    unreadCount: 1,
    senderType: 'company',
    companyId: String(companyId),
    logoUrl: logoUrl || '',
  });

  return newRoom.id;
};
