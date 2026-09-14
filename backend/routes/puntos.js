const express = require('express');
const db = require('../db/init');
const { requireAuth, requireDueño } = require('../middleware/auth');
const { avisar, avisarATodos, clientesParaAvisar } = require('../lib/notificaciones');

const router = express.Router();

router.get('/mis-puntos', requireAuth, (req, res) => {
  const usuario = db.prepare('SELECT puntos FROM usuarios WHERE id = ?').get(req.usuario.id);
  const historial = db
    .prepare(
      `SELECT t.fecha, t.hora, s.nombre AS servicio, t.puntos_otorgados
       FROM turnos t JOIN servicios s ON s.id = t.servicio_id
       WHERE t.usuario_id = ? AND t.estado = 'completado'
       ORDER BY t.fecha DESC LIMIT 20`
    )
    .all(req.usuario.id);
  // Lo que canjeó: antes sólo se veía lo que sumaba, no lo que gastaba
  const canjes = db
    .prepare(
      `SELECT c.fecha, c.puntos_usados, p.nombre AS producto
       FROM canjes c JOIN productos_canje p ON p.id = c.producto_id
       WHERE c.usuario_id = ? ORDER BY c.id DESC LIMIT 20`,
    )
    .all(req.usuario.id);

  res.json({ puntos: usuario.puntos, historial, canjes });
});

/* ?todos=1 incluye los dados de baja, para que el dueño pueda reactivarlos. */
router.get('/productos', (req, res) => {
  const todos = req.query.todos === '1';
  res.json(
    db
      .prepare(
        `SELECT * FROM productos_canje ${todos ? '' : 'WHERE activo = 1'}
         ORDER BY activo DESC, puntos_requeridos`,
      )
      .all(),
  );
});

router.post('/canjear', requireAuth, (req, res) => {
  const { producto_id } = req.body;
  const producto = db.prepare('SELECT * FROM productos_canje WHERE id = ? AND activo = 1').get(producto_id);
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
  if (producto.stock <= 0) return res.status(409).json({ error: 'Sin stock disponible' });

  const usuario = db.prepare('SELECT puntos FROM usuarios WHERE id = ?').get(req.usuario.id);
  if (usuario.puntos < producto.puntos_requeridos) {
    return res.status(400).json({ error: 'No tenés puntos suficientes para este canje' });
  }

  const tx = db.transaction(() => {
    db.prepare('UPDATE usuarios SET puntos = puntos - ? WHERE id = ?').run(producto.puntos_requeridos, req.usuario.id);
    db.prepare('UPDATE productos_canje SET stock = stock - 1 WHERE id = ?').run(producto.id);
    db.prepare('INSERT INTO canjes (usuario_id, producto_id, puntos_usados) VALUES (?, ?, ?)').run(
      req.usuario.id, producto.id, producto.puntos_requeridos
    );
  });
  tx();

  const usuarioActualizado = db.prepare('SELECT puntos FROM usuarios WHERE id = ?').get(req.usuario.id);
  res.json({ ok: true, puntos_restantes: usuarioActualizado.puntos });
});

// Administración de productos canjeables (dueño)
router.post('/productos', requireAuth, requireDueño, (req, res) => {
  const { nombre, puntos_requeridos, stock } = req.body;
  if (!nombre || !puntos_requeridos) return res.status(400).json({ error: 'Nombre y puntos_requeridos son obligatorios' });
  const info = db
    .prepare('INSERT INTO productos_canje (nombre, puntos_requeridos, stock) VALUES (?, ?, ?)')
    .run(nombre, puntos_requeridos, stock || 0);

  // Se avisa a quienes ya tienen puntos suficientes para llevárselo
  const alcanzan = db
    .prepare("SELECT id FROM usuarios WHERE rol = 'cliente' AND puntos >= ?")
    .all(puntos_requeridos)
    .map((u) => u.id);
  avisarATodos(alcanzan, {
    tipo: 'producto_nuevo',
    titulo: `Nuevo para canjear: ${nombre}`,
    cuerpo: `Cuesta ${puntos_requeridos} puntos y ya te alcanza.`,
    enlace: '/puntos',
  });

  res.status(201).json(db.prepare('SELECT * FROM productos_canje WHERE id = ?').get(info.lastInsertRowid));
});

router.put('/productos/:id', requireAuth, requireDueño, (req, res) => {
  const existe = db.prepare('SELECT * FROM productos_canje WHERE id = ?').get(req.params.id);
  if (!existe) return res.status(404).json({ error: 'Producto no encontrado' });
  const { nombre, puntos_requeridos, stock, activo } = req.body;
  db.prepare('UPDATE productos_canje SET nombre=?, puntos_requeridos=?, stock=?, activo=? WHERE id=?').run(
    nombre ?? existe.nombre,
    puntos_requeridos ?? existe.puntos_requeridos,
    stock ?? existe.stock,
    activo ?? existe.activo,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM productos_canje WHERE id = ?').get(req.params.id));
});

module.exports = router;
