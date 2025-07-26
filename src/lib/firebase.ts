
// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  "projectId": "liaison-lgale",
  "appId": "1:1097327386727:web:3433145bd16a319c22f4c2",
  "storageBucket": "liaison-lgale.firebasestorage.app",
  "apiKey": "AIzaSyCzDvuLKX2jD__W05sg9hf2DzR6aaeDPro",
  "authDomain": "liaison-lgale.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "1097327386727"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const db = getFirestore(app);

export { db };
