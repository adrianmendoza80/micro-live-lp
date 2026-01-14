import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDmbHj8dOrTEXl2IlEppmaUWIgsj2iv6sw",
  authDomain: "micro-live.firebaseapp.com",
  projectId: "micro-live",
  storageBucket: "micro-live.firebasestorage.app",
  messagingSenderId: "507578255476",
  appId: "1:507578255476:web:c11fec440f026a9aec6921",
  measurementId: "G-S0TYQJ9NC7"
};

const app = initializeApp(firebaseConfig);
// Es fundamental el 'export' para que los otros componentes lo vean
export const db = getFirestore(app);