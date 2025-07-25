
// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = 
// TODO: Fill in your Firebase project configuration object here.
{
  "apiKey": "AIzaSyC2Y4g2b-pS0TjY9qjB2s1a7F3z6e8x4Dc",
  "authDomain": "my-project-id.firebaseapp.com",
  "projectId": "my-project-id",
  "storageBucket": "my-project-id.appspot.com",
  "messagingSenderId": "4815162342",
  "appId": "1:4815162342:web:1a2b3c4d5e6f7g8h9i0j"
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



    