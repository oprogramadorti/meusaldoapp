// FIX: Remove reference to vite/client as it's not found and add a global type declaration for import.meta.env to resolve TypeScript errors.
declare global {
  interface ImportMeta {
    readonly env: {
      readonly VITE_FIREBASE_API_KEY: string;
      readonly VITE_FIREBASE_AUTH_DOMAIN: string;
      readonly VITE_FIREBASE_PROJECT_ID: string;
      readonly VITE_FIREBASE_STORAGE_BUCKET: string;
      readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
      readonly VITE_FIREBASE_APP_ID: string;
    };
  }
}

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

let firebaseConfig;

// This logic checks if environment variables are present (for production/Netlify).
// If not, it falls back to a hardcoded configuration for the development/preview environment (AI Studio).
if (import.meta.env && import.meta.env.VITE_FIREBASE_API_KEY) {
  // Use environment variables for production
  firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  };
} else {
  // Use hardcoded fallback for development/preview
  // These values are safe to be public for a client-side app protected by Firebase security rules.
  console.warn("Using fallback Firebase configuration for development. For production, please set environment variables.");
  firebaseConfig = {
    apiKey: "AIzaSyDVayfMC_1pJj-9a7W9wqb67JIYBFqhxYk",
    authDomain: "meufinanceiro-6aa43.firebaseapp.com",
    projectId: "meufinanceiro-6aa43",
    storageBucket: "meufinanceiro-6aa43.appspot.com",
    messagingSenderId: "104097770149",
  };
}

// A check to ensure Firebase config is loaded, providing a clear error if not.
if (!firebaseConfig.apiKey) {
  console.error("Firebase config not found. Make sure you have set up your environment variables (e.g., .env file).");
  const rootEl = document.getElementById('root');
  if (rootEl) {
    rootEl.innerHTML = `
      <div style="padding: 2rem; text-align: center; font-family: sans-serif;">
        <h1 style="color: #ef4444;">Erro de Configuração</h1>
        <p>A conexão com o banco de dados não pôde ser estabelecida.</p>
        <p>As variáveis de ambiente do Firebase não foram carregadas corretamente.</p>
      </div>
    `;
  }
  throw new Error("Firebase config not found.");
}


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export firestore instance
export const db = getFirestore(app);
// Export auth instance
export const auth = getAuth(app);