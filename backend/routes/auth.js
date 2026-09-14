const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const db = require('../db/init');
const { requireAuth, requireDueño } = require('../middleware/auth');

const router = express.Router();

const MIN_PASSWORD = 6;
const VALIDEZ_RECUPERACION_MIN = 60;

/*
 * Límite de intentos. Sin esto, probar contraseñas contra el login es gratis.
 * Los intentos exitosos no cuentan: quien entra bien no gasta cupo.
 */
const limiteLogin = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Probá de nuevo en un rato.' },
});

const limiteRegistro = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Demasiadas cuentas creadas desde acá. Probá más tarde.' },
});

const limiteRecuperacion = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Demasiados pedidos. Probá más tarde.' },
});

function firmarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, rol: usuario.rol, nombre: usuario.nombre },
    process.env.JWT_SECRET,
    { expiresIn: '30d' },
  );
}

const hashDe = (token) => crypto.createHash('sha256').update(token).digest('hex');

router.post('/register', limiteRegistro, (req, res) => {
  const { nombre, email, password, telefono } = req.body;
  if (!nombre || !email || !password) {
    return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios' });
  }
  if (String(password).length < MIN_PASSWORD) {
    return res.status(400).json({ error: `La contraseña necesita al menos ${MIN_PASSWORD} caracteres` });
  }

  const normalizado = String(email).trim().toLowerCase();
  const existe = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(normalizado);
  if (existe) return res.status(409).json({ error: 'Ese email ya está registrado' });

  const hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare('INSERT INTO usuarios (nombre, email, password_hash, telefono) VALUES (?, ?, ?, ?)')
    .run(nombre, normalizado, hash, telefono || null);

  const usuario = db
    .prepare('SELECT id, nombre, email, rol, puntos FROM usuarios WHERE id = ?')
    .get(info.lastInsertRowid);
  res.status(201).json({ usuario, token: firmarToken(usuario) });
});

router.post('/login', limiteLogin, (req, res) => {
  const { email, password } = req.body || {};
  const normalizado = String(email || '').trim().toLowerCase();
  const usuario = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(normalizado);

  if (!usuario || !bcrypt.compareSync(String(password || ''), usuario.password_hash)) {
    // Mismo mensaje en los dos casos: si dijera "ese email no existe" se podría
    // averiguar quién tiene cuenta.
    return res.status(401).json({ error: 'Email o contraseña incorrectos' });
  }

  const token = firmarToken(usuario);
  delete usuario.password_hash;
  res.json({ usuario, token });
});

router.get('/me', requireAuth, (req, res) => {
  const usuario = db
    .prepare('SELECT id, nombre, email, telefono, rol, puntos, fecha_registro FROM usuarios WHERE id = ?')
    .get(req.usuario.id);
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(usuario);
});

/** Cambiar la contraseña estando logueado. Pide la actual. */
router.put('/password', requireAuth, (req, res) => {
  const { actual, nueva } = req.body || {};
  if (String(nueva || '').length < MIN_PASSWORD) {
    return res.status(400).json({ error: `La contraseña necesita al menos ${MIN_PASSWORD} caracteres` });
  }

  const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.usuario.id);
  if (!usuario || !bcrypt.compareSync(String(actual || ''), usuario.password_hash)) {
    return res.status(401).json({ error: 'La contraseña actual no coincide' });
  }

  db.prepare('UPDATE usuarios SET password_hash = ? WHERE id = ?').run(
    bcrypt.hashSync(nueva, 10),
    usuario.id,
  );
  res.json({ ok: true });
});

/*
 * Recuperación de contraseña.
 *
 * Todavía no hay servidor de mails, así que el enlace lo genera y lo envía el
 * dueño por WhatsApp desde el panel. El pedido queda registrado acá; el enlace
 * se crea recién cuando el dueño lo pide, y el token se guarda hasheado.
 * Para pasar a mails, sólo hay que mandar el enlace desde este endpoint.
 */
router.post('/recuperar', limiteRecuperacion, (req, res) => {
  const normalizado = String(req.body?.email || '').trim().toLowerCase();
  const usuario = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(normalizado);

  if (usuario) {
    db.prepare(
      `INSERT INTO recuperaciones (usuario_id, token_hash, vence_en)
       VALUES (?, '', datetime('now', '+${VALIDEZ_RECUPERACION_MIN} minutes'))`,
    ).run(usuario.id);
  }

  // Siempre la misma respuesta, exista o no la cuenta
  res.json({
    ok: true,
    mensaje: 'Si el email está registrado, Jacob te va a pasar el enlace por WhatsApp.',
  });
});

/** Pedidos pendientes, para que el dueño los atienda. */
router.get('/recuperaciones', requireAuth, requireDueño, (req, res) => {
  const pedidos = db
    .prepare(
      `SELECT r.id, r.fecha, r.usado, r.vence_en,
              u.nombre AS cliente_nombre, u.email, u.telefono
       FROM recuperaciones r
       JOIN usuarios u ON u.id = r.usuario_id
       WHERE r.usado = 0 AND r.fecha > datetime('now', '-7 days')
       ORDER BY r.id DESC`,
    )
    .all();
  res.json(pedidos);
});

/**
 * Genera el enlace de una vez. El token se devuelve sólo acá y en texto plano:
 * en la base queda nada más que su hash.
 */
router.post('/recuperaciones/:id/enlace', requireAuth, requireDueño, (req, res) => {
  const pedido = db.prepare('SELECT * FROM recuperaciones WHERE id = ?').get(req.params.id);
  if (!pedido || pedido.usado) return res.status(404).json({ error: 'Pedido no encontrado' });

  const token = crypto.randomBytes(32).toString('base64url');
  db.prepare(
    `UPDATE recuperaciones
     SET token_hash = ?, vence_en = datetime('now', '+${VALIDEZ_RECUPERACION_MIN} minutes')
     WHERE id = ?`,
  ).run(hashDe(token), pedido.id);

  const base = (process.env.URL_APP || 'http://localhost:5173').replace(/\/$/, '');
  res.json({
    enlace: `${base}/recuperar/${token}`,
    vence_en_minutos: VALIDEZ_RECUPERACION_MIN,
  });
});

/** El cliente entra con el enlace y define la contraseña nueva. */
router.post('/recuperar/:token', (req, res) => {
  const { password } = req.body || {};
  if (String(password || '').length < MIN_PASSWORD) {
    return res.status(400).json({ error: `La contraseña necesita al menos ${MIN_PASSWORD} caracteres` });
  }

  const pedido = db
    .prepare(
      `SELECT * FROM recuperaciones
       WHERE token_hash = ? AND usado = 0 AND vence_en > datetime('now')`,
    )
    .get(hashDe(req.params.token));
  if (!pedido) return res.status(400).json({ error: 'El enlace no es válido o ya venció' });

  db.transaction(() => {
    db.prepare('UPDATE usuarios SET password_hash = ? WHERE id = ?').run(
      bcrypt.hashSync(password, 10),
      pedido.usuario_id,
    );
    // Se quema éste y cualquier otro pedido abierto del mismo cliente
    db.prepare('UPDATE recuperaciones SET usado = 1 WHERE usuario_id = ?').run(pedido.usuario_id);
  })();

  res.json({ ok: true });
});

module.exports = router;
