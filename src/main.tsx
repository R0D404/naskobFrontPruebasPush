import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';

// Registrar Service Worker para soporte offline PWA
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[PWA] Nueva versión disponible.');
  },
  onOfflineReady() {
    console.log('[PWA] Aplicación precacheada y lista para funcionar 100% offline.');
  },
  onRegisterError(error) {
    console.warn('[PWA] Error en registro de Service Worker:', error);
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
