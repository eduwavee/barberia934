import api from '../api/client';

/**
 * Registro del service worker y alta en las notificaciones push.
 *
 * Nada de esto es obligatorio para usar la app: si el navegador no soporta push
 * o el cliente no da permiso, los avisos igual aparecen en la campanita.
 */

export const soportaPush = () =>
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window;

/** Registra el service worker. Devuelve el registro, o null si no se pudo. */
export async function registrarServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  } catch (err) {
    console.warn('No se pudo registrar el service worker:', err);
    return null;
  }
}

/** La clave VAPID viaja en base64url y el navegador la pide como bytes. */
function claveABytes(base64url) {
  const relleno = '='.repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + relleno).replace(/-/g, '+').replace(/_/g, '/');
  const crudo = window.atob(base64);
  return Uint8Array.from([...crudo].map((c) => c.charCodeAt(0)));
}

export const permisoActual = () => (soportaPush() ? Notification.permission : 'unsupported');

/**
 * Pide permiso y registra la suscripción en el backend.
 * Devuelve 'activado' | 'denegado' | 'no-soportado' | 'sin-claves' | 'error'.
 */
export async function activarNotificaciones() {
  if (!soportaPush()) return 'no-soportado';

  const permiso = await Notification.requestPermission();
  if (permiso !== 'granted') return 'denegado';

  const registro = (await navigator.serviceWorker.getRegistration()) || (await registrarServiceWorker());
  if (!registro) return 'error';
  await navigator.serviceWorker.ready;

  try {
    const { data } = await api.get('/notificaciones/clave-publica');
    if (!data.clave) return 'sin-claves';

    // Si ya había una suscripción se reutiliza; si no, se crea
    const suscripcion =
      (await registro.pushManager.getSubscription()) ??
      (await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: claveABytes(data.clave),
      }));

    await api.post('/notificaciones/suscribir', suscripcion.toJSON());
    return 'activado';
  } catch (err) {
    console.warn('No se pudo activar el push:', err);
    return 'error';
  }
}

/** Da de baja las notificaciones del sistema en este dispositivo. */
export async function desactivarNotificaciones() {
  if (!soportaPush()) return;
  const registro = await navigator.serviceWorker.getRegistration();
  const suscripcion = await registro?.pushManager.getSubscription();
  if (!suscripcion) return;

  await api.post('/notificaciones/desuscribir', { endpoint: suscripcion.endpoint }).catch(() => {});
  await suscripcion.unsubscribe().catch(() => {});
}
