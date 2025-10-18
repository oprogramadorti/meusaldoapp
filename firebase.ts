// Fix: The triple-slash directive for 'vite/client' was causing an error because the type definition file could not be found.
// This is likely a project setup issue that cannot be fixed here.
// To resolve the errors with `import.meta.env`, we augment the global `ImportMeta` interface to include the expected environment variables.
// This provides type safety within this module without modifying the project's configuration files.
declare global {
  interface ImportMeta {
    readonly env: {
      readonly VITE_FIREBASE_API_KEY: string;
      readonly VITE_FIREBASE_AUTH_DOMAIN: string;
      readonly VITE_FIREBASE_PROJECT_ID: string;
      readonly VITE_FIREBASE_STORAGE_BUCKET: string;
      readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
      readonly VITE_FIREBASE_APP_ID: string;
    }
  }
}

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// Replaced hardcoded keys with environment variables for security and deployment flexibility.
// Make sure to set these variables in your Netlify deployment settings.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export firestore instance
export const db = getFirestore(app);
// Export auth instance
export const auth = getAuth(app);