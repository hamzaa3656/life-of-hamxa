import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey:            "AIzaSyACF8ORRoY3IsbyrQey7Zdst4UTcrQHAD8",
  authDomain:        "life-of-hamxa-a8dda.firebaseapp.com",
  projectId:         "life-of-hamxa-a8dda",
  storageBucket:     "life-of-hamxa-a8dda.firebasestorage.app",
  messagingSenderId: "554534124258",
  appId:             "1:554534124258:web:cab171c3c204e2db9ffcbb",
};

const app      = initializeApp(firebaseConfig);
export const auth     = getAuth(app);
export const db       = getFirestore(app);
export const provider = new GoogleAuthProvider();