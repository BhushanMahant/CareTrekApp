// Import the Firebase modules
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot, query as firestoreQuery, where as firestoreWhere, orderBy as firestoreOrderBy, limit as firestoreLimit, serverTimestamp as firestoreServerTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

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

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);

// Export the services and functions
export { 
  auth, 
  db, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  firestoreQuery as query, 
  firestoreWhere as where, 
  firestoreOrderBy as orderBy, 
  firestoreLimit as limit, 
  firestoreServerTimestamp as serverTimestamp 
};

// Default export for backward compatibility
export default {
  auth,
  db,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query: firestoreQuery,
  where: firestoreWhere,
  orderBy: firestoreOrderBy,
  limit: firestoreLimit,
  serverTimestamp: firestoreServerTimestamp,
  firestore: { collection, doc, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot, query: firestoreQuery, where: firestoreWhere, orderBy: firestoreOrderBy, limit: firestoreLimit, serverTimestamp: firestoreServerTimestamp }
};
