import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase yapılandırması
const firebaseConfig = {
  apiKey: "AIzaSyDvMe01RNHDbzWqC0K9LKYGLYbpqv0ZHYk",
  authDomain: "ramazanapp-5fe22.firebaseapp.com",
  projectId: "ramazanapp-5fe22",
  storageBucket: "ramazanapp-5fe22.firebasestorage.app",
  messagingSenderId: "405237139040",
  appId: "1:405237139040:web:9f5f5d275ac8975cb8a505"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);

// Servisleri dışa aktar
export const auth = getAuth(app);
export const db = getFirestore(app);