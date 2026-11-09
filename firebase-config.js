// Firebase Configuration for project: my-to-do-list-eca14
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  getDoc,
  setDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

// 專案配置 (my-to-do-list-eca14)
export const firebaseConfig = {
  apiKey: "AIzaSyCiS8v2_uzyOdyK5zLynl8yQbWswgaXvz0",
  authDomain: "my-to-do-list-eca14.firebaseapp.com",
  projectId: "my-to-do-list-eca14",
  storageBucket: "my-to-do-list-eca14.firebasestorage.app",
  messagingSenderId: "783170036816",
  appId: "1:783170036816:web:5e87d474fd067514c41d55"
};

let app, auth, db, googleProvider;
let isFirebaseInitialized = false;

export function initFirebase(customConfig = null) {
  const config = customConfig || firebaseConfig;
  try {
    app = initializeApp(config);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
    isFirebaseInitialized = true;
    return { initialized: true, app, auth, db, googleProvider };
  } catch (error) {
    console.error("Firebase 初始化失敗:", error);
    return { initialized: false, error };
  }
}

export {
  auth,
  db,
  googleProvider,
  isFirebaseInitialized,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  getDoc,
  setDoc,
  getDocs
};
