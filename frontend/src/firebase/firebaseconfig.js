import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCY7nyXyNnUdG_z_-VqK4eESHLx-jds-II",
  authDomain: "chat-application-3bd31.firebaseapp.com",
  projectId: "chat-application-3bd31",
  storageBucket: "chat-application-3bd31.firebasestorage.app",
  messagingSenderId: "882637636347",
  appId: "1:882637636347:web:c30692b288c1030375e65e",
  measurementId: "G-6QJH63JLH7"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const storage = getStorage(app);
