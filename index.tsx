
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';

// Correção do Service Worker para ambientes com restrição de origem (AI Studio/Sandboxes)
if ('serviceWorker' in navigator) {
  // Registro silencioso com caminho relativo para evitar erros de mismatch de origem em frames cross-origin
  navigator.serviceWorker.register('./sw.js', { scope: './' })
    .catch(() => {
      // Falha silenciosa se o ambiente não permitir Service Workers (ex: frames do AI Studio)
    });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </AuthProvider>
  </React.StrictMode>
);
