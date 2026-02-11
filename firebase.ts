
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

/**
 * Configuração oficial do Firebase.
 * As chaves foram inseridas diretamente para garantir o funcionamento imediato do sistema.
 */
const firebaseConfig = {
  apiKey: "AIzaSyDVayfMC_1pJj-9a7W9wqb67JIYBFqhxYk",
  authDomain: "meufinanceiro-6aa43.firebaseapp.com",
  projectId: "meufinanceiro-6aa43",
  storageBucket: "meufinanceiro-6aa43.firebasestorage.app",
  messagingSenderId: "104097770149",
  appId: "1:104097770149:web:ac2101966528f835b0bb4c"
};

// Inicializa o Firebase apenas uma vez
const app = initializeApp(firebaseConfig);

// Exporta as instâncias necessárias para o restante da aplicação
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
