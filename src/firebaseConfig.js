import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';


const firebaseConfig = {
  apiKey: "AIzaSyC9rDEoEEkscQWPpXyL6oBNf3IlA2z7o6w",
  authDomain: "farmily-33b38.firebaseapp.com",
  projectId: "farmily-33b38",
  storageBucket: "farmily-33b38.firebasestorage.app",
  messagingSenderId: "685447137176",
  appId: "1:685447137176:web:ee1b0a03f7ed3794f60ded",
  measurementId: "G-SCF515K7J0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

export const storage = getStorage(app);



// Export the auth and db objects for use in other components
export { auth, db };