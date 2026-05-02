import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC5lh7EqaPZ0A8bkx61TsfHMcGXd_-ppAg",
  authDomain: "geometric-ivy-446517-q0-a1a40.firebaseapp.com",
  projectId: "geometric-ivy-446517-q0-a1a40",
  storageBucket: "geometric-ivy-446517-q0-a1a40.firebasestorage.app",
  messagingSenderId: "429171109967",
  appId: "1:429171109967:web:b3a8454530aa276dc3ba3a",
  measurementId: "G-3YG9TC80PP"
};

const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export default app;
