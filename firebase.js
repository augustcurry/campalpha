import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// IMPORTANT: PASTE YOUR FIREBASE CONFIG OBJECT HERE
const firebaseConfig = {
  apiKey: "AIzaSyBanmVqqao0ZYlAjFTtSJCy9-vh2dZo0Eg",
  authDomain: "campbackend.firebaseapp.com",
  projectId: "campbackend",
  storageBucket: "campbackend.firebasestorage.app",
  messagingSenderId: "230528492353",
  appId: "1:230528492353:web:b4338d4b71ae79915af7c0",
  measurementId: "G-Y2BLHP83W8"
};


// Initialize Firebase
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Initialize Auth with persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// Export the services we'll need
export { auth }; // We only need to export the new auth instance
export const db = getFirestore(app);
