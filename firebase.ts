import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDVayfMC_1pJj-9a7W9wqb67JIYBFqhxYk",
  authDomain: "meufinanceiro-6aa43.firebaseapp.com",
  projectId: "meufinanceiro-6aa43",
  storageBucket: "meufinanceiro-6aa43.firebasestorage.app",
  messagingSenderId: "104097770149",
  appId: "1:104097770149:web:ac2101966528f835b0bb4c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export firestore instance
export const db = getFirestore(app);
// Export auth instance
export const auth = getAuth(app);