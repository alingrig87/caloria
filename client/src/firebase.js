import { initializeApp } from "firebase/app";
import { initializeAuth, browserLocalPersistence, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBT8hhzO9sdRzfuBBonWe7ro68emyVrPh4",
  authDomain: "calorai-33f02.firebaseapp.com",
  projectId: "calorai-33f02",
  storageBucket: "calorai-33f02.firebasestorage.app",
  messagingSenderId: "1044490320706",
  appId: "1:1044490320706:web:0c5664c5399a55df9366db",
};

const app = initializeApp(firebaseConfig);

// browserLocalPersistence reads auth token from localStorage (synchronous),
// so auth.currentUser is available immediately on module import — no async wait
export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence,
});
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
