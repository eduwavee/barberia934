const express = require('express');
const db = require('../db/init');
const { requireAuth, requireDueño } = require('../middleware/auth');

const router = express.Router();

// Listado de clientes (dueño), con sus puntos
router.get('/', requireAuth, requireDueño, (req, res) => {
  const clientes = db
    .prepare(
      `SELECT id, nombre, email, telefono, puntos, fecha_registro FROM usuarios WHERE rol = 'cliente' ORDER BY fecha_registro DESC`
    )
    .all();
  res.json(clientes);
});

module.exports = router;
