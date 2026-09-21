// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBbbvc8tMhZnzZjCKNS6XuO-E_nZW6SywI",
  authDomain: "skill-prep-cde3a.firebaseapp.com",
  projectId: "skill-prep-cde3a",
  storageBucket: "skill-prep-cde3a.firebasestorage.app",
  messagingSenderId: "765032875734",
  appId: "1:765032875734:web:a65d2759c70d8a25196b77",
  measurementId: "G-421YNL8L0L"
};

// Initialize Firebase
const app = !getApps.length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
// const analytics = getAnalytics(app);