/**
 * Notificaciones para el cliente.
 *
 * Cada aviso se guarda siempre en la base —así aparece en la campanita aunque
 * el cliente no haya dado permiso de push— y además se intenta mandar como
 * notificación del sistema a los navegadores suscriptos.
 */
const webpush = require('web-push');
const db = require('../db/init');

const PUBLICA = process.env.VAPID_PUBLIC_KEY;
const PRIVADA = process.env.VAPID_PRIVATE_KEY;
const pushDisponible = Boolean(PUBLICA && PRIVADA);

if (pushDisponible) {
  webpush.setVapidDetails(
    process.env.VAPID_CONTACTO || 'mailto:hola@barberia93cuartos.com',
    PUBLICA,
    PRIVADA,
  );
} else {
  console.warn('Sin claves VAPID: las notificaciones quedan sólo dentro de la app.');
}

const insertar = db.prepare(
  `INSERT INTO notificaciones (usuario_id, tipo, titulo, cuerpo, enlace)
   VALUES (@usuario_id, @tipo, @titulo, @cuerpo, @enlace)`,
);
const suscripcionesDe = db.prepare('SELECT * FROM suscripciones_push WHERE usuario_id = ?');
const borrarSuscripcion = db.prepare('DELETE FROM suscripciones_push WHERE id = ?');

/** Manda el push a todos los navegadores donde el cliente activó los avisos. */
async function empujar(usuarioId, carga) {
  if (!pushDisponible) return;

  const suscripciones = suscripcionesDe.all(usuarioId);
  await Promise.all(
    suscripciones.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(carga),
        );
      } catch (err) {
        // 404/410 = el navegador ya no acepta esa suscripción (desinstaló la
        // app o limpió los datos): se borra para no reintentar por siempre.
        if (err.statusCode === 404 || err.statusCode === 410) borrarSuscripcion.run(s.id);
        else console.error('Push fallido:', err.statusCode, err.body || err.message);
      }
    }),
  );
}

/**
 * Crea un aviso para un cliente.
 * No lanza: que falle una notificación nunca debe voltear la operación que la
 * originó (reservar, completar un turno, canjear).
 */
function avisar({ usuarioId, tipo, titulo, cuerpo = null, enlace = null }) {
  try {
    insertar.run({ usuario_id: usuarioId, tipo, titulo, cuerpo, enlace });
    empujar(usuarioId, { titulo, cuerpo, enlace, tipo }).catch(() => {});
  } catch (err) {
    console.error('No se pudo crear la notificación:', err.message);
  }
}

/** Mismo aviso para varios clientes (por ejemplo, un horario que se liberó). */
function avisarATodos(usuarioIds, aviso) {
  usuarioIds.forEach((usuarioId) => avisar({ ...aviso, usuarioId }));
}

/** Clientes activos, sin contar al dueño ni al que disparó el evento. */
function clientesParaAvisar({ excepto = [] } = {}) {
  return db
    .prepare("SELECT id FROM usuarios WHERE rol = 'cliente'")
    .all()
    .map((u) => u.id)
    .filter((id) => !excepto.includes(id));
}

/**
 * Si con los puntos que tiene ya le alcanza para algo, se lo avisa.
 * Se llama después de sumar puntos o de cambiar el catálogo.
 */
function avisarSiPuedeCanjear(usuarioId) {
  const usuario = db.prepare('SELECT puntos FROM usuarios WHERE id = ?').get(usuarioId);
  if (!usuario) return;

  const alcanza = db
    .prepare(
      `SELECT nombre, puntos_requeridos FROM productos_canje
       WHERE activo = 1 AND stock > 0 AND puntos_requeridos <= ?
       ORDER BY puntos_requeridos DESC`,
    )
    .all(usuario.puntos);
  if (alcanza.length === 0) return;

  const cuerpo =
    alcanza.length === 1
      ? `Ya podés canjear ${alcanza[0].nombre}.`
      : `Ya podés canjear ${alcanza.length} productos, entre ellos ${alcanza[0].nombre}.`;

  avisar({
    usuarioId,
    tipo: 'puntos_disponibles',
    titulo: `Tenés ${usuario.puntos} puntos para canjear`,
    cuerpo,
    enlace: '/puntos',
  });
}

module.exports = {
  avisar,
  avisarATodos,
  clientesParaAvisar,
  avisarSiPuedeCanjear,
  pushDisponible,
  clavePublica: PUBLICA || null,
};
