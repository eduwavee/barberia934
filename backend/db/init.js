const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DB_PATH || path.join(__dirname, 'barberia.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  telefono TEXT,
  rol TEXT NOT NULL DEFAULT 'cliente' CHECK (rol IN ('cliente','dueño')),
  puntos INTEGER NOT NULL DEFAULT 0,
  fecha_registro TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS servicios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  precio REAL NOT NULL,
  duracion_min INTEGER NOT NULL DEFAULT 30,
  puntos_otorgados INTEGER NOT NULL DEFAULT 100,
  activo INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS horarios_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dia_semana INTEGER NOT NULL,
  hora_inicio TEXT NOT NULL,
  hora_fin TEXT NOT NULL,
  intervalo_min INTEGER NOT NULL DEFAULT 60,
  activo INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS turnos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  servicio_id INTEGER NOT NULL REFERENCES servicios(id),
  fecha TEXT NOT NULL,
  hora TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','confirmado','cancelado','completado')),
  metodo_pago TEXT,
  puntos_otorgados INTEGER,
  fecha_creacion TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(fecha, hora)
);

CREATE TABLE IF NOT EXISTS productos_canje (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  puntos_requeridos INTEGER NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  imagen TEXT,
  activo INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS canjes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  producto_id INTEGER NOT NULL REFERENCES productos_canje(id),
  puntos_usados INTEGER NOT NULL,
  fecha TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pagos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  turno_id INTEGER REFERENCES turnos(id),
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  monto REAL NOT NULL,
  metodo TEXT NOT NULL CHECK (metodo IN ('mercadopago','naranjax','efectivo')),
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','pagado','rechazado')),
  fecha TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS movimientos_caja (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL CHECK (tipo IN ('ingreso','gasto')),
  concepto TEXT NOT NULL,
  monto REAL NOT NULL,
  origen TEXT NOT NULL DEFAULT 'manual' CHECK (origen IN ('turno','manual')),
  turno_id INTEGER REFERENCES turnos(id),
  fecha TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

module.exports = db;
