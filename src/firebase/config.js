// =========================================================================
// FILE: src/firebase/config.js
// This file initializes Firebase and exports the database and storage instances.
// =========================================================================
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// IMPORTANT: Replace with your actual Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCF0aQH3WT_3A5k_-sGEoC_SxxA4JcQIjI",
  authDomain: "expo-25.firebaseapp.com",
  projectId: "expo-25",
  storageBucket: "expo-25.firebasestorage.app",
  messagingSenderId: "851912300575",
  appId: "1:851912300575:web:3bfbdb30cbc354fc201d2a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
