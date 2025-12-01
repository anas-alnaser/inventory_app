// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCYe5xXLM0DBUsf6Ru1DjyIfC2Zuq-A0t0",
  authDomain: "anas-9f395.firebaseapp.com",
  projectId: "anas-9f395",
  storageBucket: "anas-9f395.firebasestorage.app",
  messagingSenderId: "375882098172",
  appId: "1:375882098172:web:1e2c6977645b3794173e79",
  measurementId: "G-DK0E6GSLT0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (only in browser environment)
let analytics = null;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

export { app, analytics };

