import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAeacUnlh2tM6dFmJvVgEHmQlqxaOgAO_k",
  authDomain: "portmatch-6ca20.firebaseapp.com",
  projectId: "portmatch-6ca20",
  storageBucket: "portmatch-6ca20.firebasestorage.app",
  messagingSenderId: "524944500380",
  appId: "1:524944500380:web:6314e596fb45465728ef59",
  measurementId: "G-WK2WQSY09C"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);