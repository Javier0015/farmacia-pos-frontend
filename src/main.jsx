import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';

import './index.css';

import AppRouter from './router/AppRouter';
import { AuthProvider } from './context/AuthContext';

registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('Nueva versión disponible de Shaddai POS');
  },
  onOfflineReady() {
    console.log('Shaddai POS listo para uso offline básico');
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  </StrictMode>
);