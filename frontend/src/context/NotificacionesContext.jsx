import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext';

const NotificacionesContext = createContext(null);

const CADA = 60_000; // cada cuánto se vuelve a preguntar por avisos nuevos

export function NotificacionesProvider({ children }) {
  const { usuario } = useAuth();
  const [notificaciones, setNotificaciones] = useState([]);
  const [sinLeer, setSinLeer] = useState(0);
  const [cargando, setCargando] = useState(true);
  const vigente = useRef(true);

  const cargar = useCallback(async () => {
    if (!usuario) {
      setNotificaciones([]);
      setSinLeer(0);
      setCargando(false);
      return;
    }
    try {
      const { data } = await api.get('/notificaciones');
      if (!vigente.current) return;
      setNotificaciones(data.notificaciones);
      setSinLeer(data.sinLeer);
    } catch {
      // Si falla, se deja lo último que se había traído
    } finally {
      if (vigente.current) setCargando(false);
    }
  }, [usuario]);

  useEffect(() => {
    vigente.current = true;
    cargar();

    // Se consulta cada tanto, y también al volver a la app
    const reloj = window.setInterval(cargar, CADA);
    const alVolver = () => document.visibilityState === 'visible' && cargar();
    document.addEventListener('visibilitychange', alVolver);

    return () => {
      vigente.current = false;
      window.clearInterval(reloj);
      document.removeEventListener('visibilitychange', alVolver);
    };
  }, [cargar]);

  const marcarLeida = useCallback(async (id) => {
    setNotificaciones((previas) =>
      previas.map((n) => (n.id === id ? { ...n, leida: 1 } : n)),
    );
    setSinLeer((n) => Math.max(0, n - 1));
    await api.put(`/notificaciones/${id}/leida`).catch(() => {});
  }, []);

  const marcarTodasLeidas = useCallback(async () => {
    setNotificaciones((previas) => previas.map((n) => ({ ...n, leida: 1 })));
    setSinLeer(0);
    await api.put('/notificaciones/leer-todas').catch(() => {});
  }, []);

  const eliminar = useCallback(async (id) => {
    setNotificaciones((previas) => {
      const objetivo = previas.find((n) => n.id === id);
      if (objetivo && !objetivo.leida) setSinLeer((n) => Math.max(0, n - 1));
      return previas.filter((n) => n.id !== id);
    });
    await api.delete(`/notificaciones/${id}`).catch(() => {});
  }, []);

  return (
    <NotificacionesContext.Provider
      value={{ notificaciones, sinLeer, cargando, cargar, marcarLeida, marcarTodasLeidas, eliminar }}
    >
      {children}
    </NotificacionesContext.Provider>
  );
}

export const useNotificaciones = () => useContext(NotificacionesContext);
