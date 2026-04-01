// src/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAIUWDdtKjktGUWkN4XKrzq6umVdxAbmjI",
  authDomain: "nagarni.firebaseapp.com",
  projectId: "nagarni",
  storageBucket: "nagarni.appspot.com",
  messagingSenderId: "793021981622",
  appId: "1:793021981622:web:b4e640ff9185b1a543d717",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export const storage = getStorage(app);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});