import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, initializeAuth, indexedDBLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';

const firebaseConfig = {
  apiKey: "AIzaSyDMRCLa_cJI5SrzbV0BN7HjW_Z-ClNwb9M",
  authDomain: "accountingapp-88ab5.firebaseapp.com",
  projectId: "accountingapp-88ab5",
  storageBucket: "accountingapp-88ab5.firebasestorage.app",
  messagingSenderId: "456811032968",
  appId: "1:456811032968:android:f68acfd8386c36d06d4a3d"
};

const app = initializeApp(firebaseConfig);

export const auth = Capacitor.isNativePlatform()
  ? initializeAuth(app, { persistence: indexedDBLocalPersistence })
  : getAuth(app);

export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
