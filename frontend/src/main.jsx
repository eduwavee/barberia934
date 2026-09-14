import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { registrarServiceWorker } from './lib/push';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// El service worker deja la app instalable y habilita las notificaciones.
// En desarrollo se saltea: el caché estorba al hot reload.
if (import.meta.env.PROD) {
  window.addEventListener('load', () => registrarServiceWorker());
}
