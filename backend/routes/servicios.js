const express = require('express');
const db = require('../db/init');
const { requireAuth, requireDueño } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const servicios = db.prepare('SELECT * FROM servicios WHERE activo = 1 ORDER BY precio').all();
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
