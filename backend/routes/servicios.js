const express = require('express');
const db = require('../db/init');
const { requireAuth, requireDueño } = require('../middleware/auth');

const router = express.Router();

/*
 * Por defecto sólo los activos, que es lo que ve el cliente al reservar.
 * Con ?todos=1 vienen también los dados de baja, para que el dueño pueda
 * reactivarlos: si no, desactivar uno lo hacía desaparecer para siempre.
 */
router.get('/', (req, res) => {
  const todos = req.query.todos === '1';
  const servicios = db
    .prepare(`SELECT * FROM servicios ${todos ? '' : 'WHERE activo = 1'} ORDER BY activo DESC, precio`)
    .all();
  res.json(servicios);
});

router.post('/', requireAuth, requireDueño, (req, res) => {
  const { nombre, precio, duracion_min, puntos_otorgados } = req.body;
  if (!nombre || !precio) return res.status(400).json({ error: 'Nombre y precio son obligatorios' });
  const info = db
    .prepare('INSERT INTO servicios (nombre, precio, duracion_min, puntos_otorgados) VALUES (?, ?, ?, ?)')
    .run(nombre, precio, duracion_min || 30, puntos_otorgados || 100);
  res.status(201).json(db.prepare('SELECT * FROM servicios WHERE id = ?').get(info.lastInsertRowid));
});

router.put('/:id', requireAuth, requireDueño, (req, res) => {
  const { nombre, precio, duracion_min, puntos_otorgados, activo } = req.body;
  const existe = db.prepare('SELECT * FROM servicios WHERE id = ?').get(req.params.id);
  if (!existe) return res.status(404).json({ error: 'Servicio no encontrado' });
  db.prepare(
    'UPDATE servicios SET nombre=?, precio=?, duracion_min=?, puntos_otorgados=?, activo=? WHERE id=?'
  ).run(
    nombre ?? existe.nombre,
    precio ?? existe.precio,
    duracion_min ?? existe.duracion_min,
    puntos_otorgados ?? existe.puntos_otorgados,
    activo ?? existe.activo,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM servicios WHERE id = ?').get(req.params.id));
});

router.delete('/:id', requireAuth, requireDueño, (req, res) => {
  db.prepare('UPDATE servicios SET activo = 0 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
