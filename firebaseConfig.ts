// Import the functions you need from the React Native Firebase packages
import { initializeApp } from 'firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with persistence
// React Native Firebase handles persistence automatically with AsyncStorage

// Enable Firestore offline persistence
firestore()
  .settings({
    persistence: true, // Enable offline persistence
    cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED
  })
  .then(() => {
    console.log('Firestore persistence enabled');
  })
  .catch((err: any) => {
    if (err.code === 'failed-precondition') {
      console.warn('Offline persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.warn('The current environment does not support offline persistence.');
    }
  });

// Get references to the services
export const authInstance = auth();
export const db = firestore();
export const storageRef = storage();
export default app;