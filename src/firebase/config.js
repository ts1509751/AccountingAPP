import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAhGKmhVkhsjA5LtjNrjnbHEzjVRQB5zho",
  authDomain: "my-expense-tracker-90de8.firebaseapp.com",
  projectId: "my-expense-tracker-90de8",
  storageBucket: "my-expense-tracker-90de8.firebasestorage.app",
  messagingSenderId: "382467613969",
  appId: "1:382467613969:web:813a097f684858fdc6d8b0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
