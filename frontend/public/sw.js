/*
 * Service worker de Barbería 9 ¾.
 *
 * Hace dos cosas: deja la app instalable (cachea el envoltorio para que abra
 * aunque la conexión esté mala) y recibe las notificaciones push.
 *
 * Importante: NO se cachean las llamadas a la API. Los turnos y los puntos
 * tienen que verse siempre al día; servir una versión vieja sería peor que
 * mostrar un error.
 */
const CACHE = 'barberia-9-3-4-v1';
const ESENCIALES = ['/', '/index.html', '/manifest.webmanifest', '/icons/icono-192.png'];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(ESENCIALES))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (evento) => {
  const url = new URL(evento.request.url);
  const esApi = url.pathname.startsWith('/api') || url.port === '4000';
  if (evento.request.method !== 'GET' || esApi) return;

  // Navegación: se intenta la red y se cae al envoltorio guardado
  if (evento.request.mode === 'navigate') {
    evento.respondWith(
      fetch(evento.request).catch(() => caches.match('/index.html').then((r) => r || Response.error())),
    );
    return;
  }

  // Estáticos: lo que esté en caché primero, y se actualiza de fondo
  evento.respondWith(
    caches.match(evento.request).then((guardado) => {
      const desdeRed = fetch(evento.request)
        .then((respuesta) => {
          if (respuesta.ok && url.origin === self.location.origin) {
            const copia = respuesta.clone();
            caches.open(CACHE).then((c) => c.put(evento.request, copia));
          }
          return respuesta;
        })
        .catch(() => guardado);
      return guardado || desdeRed;
    }),
  );
});

self.addEventListener('push', (evento) => {
  let datos = {};
  try {
    datos = evento.data ? evento.data.json() : {};
  } catch {
    datos = { titulo: 'Barbería 9 ¾', cuerpo: evento.data ? evento.data.text() : '' };
  }

  evento.waitUntil(
    self.registration.showNotification(datos.titulo || 'Barbería 9 ¾', {
      body: datos.cuerpo || '',
      icon: '/icons/icono-192.png',
      badge: '/icons/badge-96.png',
      tag: datos.tipo || 'barberia',
      renotify: true,
      data: { enlace: datos.enlace || '/' },
      vibrate: [60, 40, 60],
    }),
  );
});

self.addEventListener('notificationclick', (evento) => {
  evento.notification.close();
  const destino = evento.notification.data?.enlace || '/';

  evento.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ventanas) => {
      // Si la app ya está abierta, se la trae al frente en vez de abrir otra
      const abierta = ventanas.find((v) => v.url.startsWith(self.location.origin));
      if (abierta) return abierta.focus().then((v) => v.navigate(destino));
      return self.clients.openWindow(destino);
    }),
  );
});
