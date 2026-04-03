// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAvax49dqRIL469ZKSWalgsnJfaDg-h5xw",
  authDomain: "vtstockmgt.firebaseapp.com",
  projectId: "vtstockmgt",
  storageBucket: "vtstockmgt.firebasestorage.app",
  messagingSenderId: "888159706496",
  appId: "1:888159706496:web:5d16f352625581b45d7565",
  measurementId: "G-X0YSH5BYXH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);