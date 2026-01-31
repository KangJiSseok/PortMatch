import {
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    Timestamp,
    type DocumentData
} from "firebase/firestore";
import { db } from "../lib/firebase";

export interface Message {
    id: string;
    text: string;
    senderId: string;
    createdAt: Timestamp | null;
}

export const sendMessage = async (roomId: string, text: string, senderId: string): Promise<void> => {
    try {
        await addDoc(collection(db, "chatrooms", roomId, "messages"), {
            text,
            senderId,
            createdAt: serverTimestamp(),
        });
    } catch (error) {
        throw error;
    }
};

export const subscribeMessages = (roomId: string, callback: (messages: Message[]) => void) => {
    const q = query(
        collection(db, "chatrooms", roomId, "messages"),
        orderBy("createdAt", "asc")
    );

    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map((doc) => {
            const data = doc.data() as DocumentData;
            return {
                id: doc.id,
                text: data.text,
                senderId: data.senderId,
                createdAt: data.createdAt,
            } as Message;
        });
        callback(messages);
    });
};