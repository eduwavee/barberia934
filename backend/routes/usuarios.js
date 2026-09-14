const express = require('express');
const db = require('../db/init');
const { requireAuth, requireDueño } = require('../middleware/auth');

const router = express.Router();

/** Listado de clientes con sus puntos y un resumen de actividad. */
router.get('/', requireAuth, requireDueño, (req, res) => {
  const clientes = db
    .prepare(
      `SELECT u.id, u.nombre, u.email, u.telefono, u.puntos, u.fecha_registro,
              (SELECT COUNT(*) FROM turnos t
                WHERE t.usuario_id = u.id AND t.estado = 'completado') AS cortes,
              (SELECT MAX(t.fecha) FROM turnos t
                WHERE t.usuario_id = u.id AND t.estado = 'completado') AS ultima_visita
       FROM usuarios u
       WHERE u.rol = 'cliente'
       ORDER BY u.fecha_registro DESC`,
    )
    .all();
  res.json(clientes);
});

/**
 * Perfil del cliente logueado.
 *
 * Va antes de '/:id' a propósito: si no, Express tomaría "perfil" como un id.
 */
router.put('/perfil', requireAuth, (req, res) => {
  const { nombre, telefono } = req.body || {};

  if (nombre !== undefined && String(nombre).trim().length < 2) {
    return res.status(400).json({ error: 'El nombre es muy corto' });
  }
  if (telefono !== undefined && telefono !== null && telefono !== '') {
    const digitos = String(telefono).replace(/\D/g, '');
    if (digitos.length < 8) return res.status(400).json({ error: 'El teléfono es muy corto' });
  }

  const actual = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.usuario.id);
  if (!actual) return res.status(404).json({ error: 'Usuario no encontrado' });

  db.prepare('UPDATE usuarios SET nombre = ?, telefono = ? WHERE id = ?').run(
    nombre !== undefined ? String(nombre).trim() : actual.nombre,
    telefono !== undefined ? String(telefono).trim() || null : actual.telefono,
    req.usuario.id,
  );

  res.json(
    db
      .prepare('SELECT id, nombre, email, telefono, rol, puntos, fecha_registro FROM usuarios WHERE id = ?')
      .get(req.usuario.id),
  );
});

/** Ficha de un cliente: turnos, canjes y cuánto dejó en la barbería. */
router.get('/:id', requireAuth, requireDueño, (req, res) => {
  const cliente = db
    .prepare(
      `SELECT id, nombre, email, telefono, puntos, fecha_registro
       FROM usuarios WHERE id = ? AND rol = 'cliente'`,
    )
    .get(req.params.id);
  if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });

  const turnos = db
    .prepare(
      `SELECT t.id, t.fecha, t.hora, t.estado, t.puntos_otorgados,
              s.nombre AS servicio_nombre, s.precio
       FROM turnos t JOIN servicios s ON s.id = t.servicio_id
       WHERE t.usuario_id = ?
       ORDER BY t.fecha DESC, t.hora DESC
       LIMIT 50`,
    )
    .all(cliente.id);

  const canjes = db
    .prepare(
      `SELECT c.fecha, c.puntos_usados, p.nombre AS producto
       FROM canjes c JOIN productos_canje p ON p.id = c.producto_id
       WHERE c.usuario_id = ? ORDER BY c.id DESC LIMIT 30`,
    )
    .all(cliente.id);

  const resumen = db
    .prepare(
      `SELECT COUNT(*) AS cortes,
              COALESCE(SUM(s.precio), 0) AS gastado,
              MAX(t.fecha) AS ultima_visita
       FROM turnos t JOIN servicios s ON s.id = t.servicio_id
       WHERE t.usuario_id = ? AND t.estado = 'completado'`,
    )
    .get(cliente.id);

  const cancelados = db
    .prepare("SELECT COUNT(*) AS c FROM turnos WHERE usuario_id = ? AND estado = 'cancelado'")
    .get(cliente.id).c;

  res.json({ cliente, resumen: { ...resumen, cancelados }, turnos, canjes });
});

module.exports = router;
