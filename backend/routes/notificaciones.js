const express = require('express');
const db = require('../db/init');
const { requireAuth } = require('../middleware/auth');
const { clavePublica } = require('../lib/notificaciones');

const router = express.Router();

/** Clave pública VAPID: el navegador la necesita para suscribirse al push. */
router.get('/clave-publica', (req, res) => {
  res.json({ clave: clavePublica });
});

/** Avisos del cliente logueado, del más nuevo al más viejo. */
router.get('/', requireAuth, (req, res) => {
  const limite = Math.min(Number(req.query.limite) || 30, 100);
  const lista = db
    .prepare('SELECT * FROM notificaciones WHERE usuario_id = ? ORDER BY id DESC LIMIT ?')
    .all(req.usuario.id, limite);
  const sinLeer = db
    .prepare('SELECT COUNT(*) AS c FROM notificaciones WHERE usuario_id = ? AND leida = 0')
    .get(req.usuario.id).c;
  res.json({ notificaciones: lista, sinLeer });
});

/** Sólo el contador, para el globito de la campanita. */
router.get('/sin-leer', requireAuth, (req, res) => {
  const { c } = db
    .prepare('SELECT COUNT(*) AS c FROM notificaciones WHERE usuario_id = ? AND leida = 0')
    .get(req.usuario.id);
  res.json({ sinLeer: c });
});

router.put('/:id/leida', requireAuth, (req, res) => {
  const info = db
    .prepare('UPDATE notificaciones SET leida = 1 WHERE id = ? AND usuario_id = ?')
    .run(req.params.id, req.usuario.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Notificación no encontrada' });
  res.json({ ok: true });
});

router.put('/leer-todas', requireAuth, (req, res) => {
  db.prepare('UPDATE notificaciones SET leida = 1 WHERE usuario_id = ? AND leida = 0').run(
    req.usuario.id,
  );
  res.json({ ok: true });
});

router.delete('/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM notificaciones WHERE id = ? AND usuario_id = ?').run(
    req.params.id,
    req.usuario.id,
  );
  res.json({ ok: true });
});

/** El navegador registra acá su suscripción push. */
router.post('/suscribir', requireAuth, (req, res) => {
  const { endpoint, keys } = req.body || {};
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ error: 'Suscripción incompleta' });
  }

  // El mismo endpoint puede venir de otra sesión: se reasigna al usuario actual.
  db.prepare(
    `INSERT INTO suscripciones_push (usuario_id, endpoint, p256dh, auth)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(endpoint) DO UPDATE SET
       usuario_id = excluded.usuario_id,
       p256dh = excluded.p256dh,
       auth = excluded.auth`,
  ).run(req.usuario.id, endpoint, keys.p256dh, keys.auth);

  res.status(201).json({ ok: true });
});

router.post('/desuscribir', requireAuth, (req, res) => {
  const { endpoint } = req.body || {};
  if (endpoint) {
    db.prepare('DELETE FROM suscripciones_push WHERE endpoint = ? AND usuario_id = ?').run(
      endpoint,
      req.usuario.id,
    );
  }
  res.json({ ok: true });
});

module.exports = router;
