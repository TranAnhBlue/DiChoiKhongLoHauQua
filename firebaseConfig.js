// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyBTdLMPR96jQtx6qvoxm2fwrmvFSJnM84E",
    authDomain: "event-finder-app-3331f.firebaseapp.com",
    projectId: "event-finder-app-3331f",
    storageBucket: "event-finder-app-3331f.appspot.com",
    messagingSenderId: "902831259261",
    appId: "1:902831259261:android:9f46331ec4a07c479bfb14"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
