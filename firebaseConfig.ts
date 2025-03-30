// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC5izWiEwirQxRX08Nr_-WzidBV5xvOOsg",
    authDomain: "minigames-app-60e24.firebaseapp.com",
    projectId: "minigames-app-60e24",
    storageBucket: "minigames-app-60e24.firebasestorage.app",
    messagingSenderId: "277585238418",
    appId: "1:277585238418:web:ae7323a4f77b679b43c94b"
  };
// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);