const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/init');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function firmarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, rol: usuario.rol, nombre: usuario.nombre },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

router.post('/register', (req, res) => {
  const { nombre, email, password, telefono } = req.body;
  if (!nombre || !email || !password) {
    return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios' });
  }
  const existe = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email);
  if (existe) return res.status(409).json({ error: 'Ese email ya está registrado' });

  const hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare('INSERT INTO usuarios (nombre, email, password_hash, telefono) VALUES (?, ?, ?, ?)')
    .run(nombre, email, hash, telefono || null);

  const usuario = db.prepare('SELECT id, nombre, email, rol, puntos FROM usuarios WHERE id = ?').get(info.lastInsertRowid);
  const token = firmarToken(usuario);
  res.status(201).json({ usuario, token });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const usuario = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);
  if (!usuario || !bcrypt.compareSync(password, usuario.password_hash)) {
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

module.exports = router;
