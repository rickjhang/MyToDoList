// Firebase Configuration for project: my-to-do-list-eca14
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
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
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// 預設配置 (專案 ID: my-to-do-list-eca14)
// 若有儲存在 localStorage 的 apiKey，會優先使用，方便使用者在介面直接輸入
const savedConfig = JSON.parse(localStorage.getItem("my_todo_firebase_config") || "{}");

export const firebaseConfig = {
  apiKey: savedConfig.apiKey || "AIzaSy_YOUR_API_KEY_HERE",
  authDomain: savedConfig.authDomain || "my-to-do-list-eca14.firebaseapp.com",
  projectId: savedConfig.projectId || "my-to-do-list-eca14",
  storageBucket: savedConfig.storageBucket || "my-to-do-list-eca14.appspot.com",
  messagingSenderId: savedConfig.messagingSenderId || "YOUR_MESSAGING_SENDER_ID",
  appId: savedConfig.appId || "YOUR_APP_ID"
};

let app, auth, db, googleProvider;
let isFirebaseInitialized = false;

export function initFirebase(customConfig = null) {
  const config = customConfig || firebaseConfig;
  try {
    if (!config.apiKey || config.apiKey.includes("YOUR_API_KEY")) {
      console.warn("Firebase apiKey 尚未填入，請在設定中輸入您的 Web API Key");
      isFirebaseInitialized = false;
      return { initialized: false, missingApiKey: true };
    }
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
