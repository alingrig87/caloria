import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore, persistentLocalCache } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBT8hhzO9sdRzfuBBonWe7ro68emyVrPh4",
  authDomain: "calorai-33f02.firebaseapp.com",
  projectId: "calorai-33f02",
  storageBucket: "calorai-33f02.firebasestorage.app",
  messagingSenderId: "1044490320706",
  appId: "1:1044490320706:web:0c5664c5399a55df9366db",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
// Persistent local cache: serves data from IndexedDB instantly on refresh
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache(),
});
