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
  fecha_creacion TEXT NOT NULL DEFAULT (datetime('now'))
);

/*
 * Días y horarios que el dueño cierra a mano: feriados, vacaciones o un turno
 * suelto que quiere reservarse. Con hora en NULL se bloquea el día entero.
 */
CREATE TABLE IF NOT EXISTS bloqueos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha TEXT NOT NULL,
  hora TEXT,
  motivo TEXT,
  fecha_creacion TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notificaciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  cuerpo TEXT,
  enlace TEXT,
  leida INTEGER NOT NULL DEFAULT 0,
  fecha TEXT NOT NULL DEFAULT (datetime('now'))
);

/* Suscripciones del navegador para las notificaciones push (Web Push). */
CREATE TABLE IF NOT EXISTS suscripciones_push (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  fecha TEXT NOT NULL DEFAULT (datetime('now'))
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

CREATE INDEX IF NOT EXISTS idx_turnos_fecha ON turnos(fecha);
CREATE INDEX IF NOT EXISTS idx_bloqueos_fecha ON bloqueos(fecha);
CREATE INDEX IF NOT EXISTS idx_notif_usuario ON notificaciones(usuario_id, leida, id DESC);
`);

/*
 * Un horario sólo puede estar tomado por un turno activo. Va como índice
 * parcial y no como UNIQUE de tabla: si contara los cancelados, al cancelar un
 * turno ese horario quedaba inutilizable para siempre — se mostraba libre y al
 * reservarlo reventaba.
 */
db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS idx_turnos_horario_ocupado
  ON turnos(fecha, hora) WHERE estado IN ('pendiente','confirmado');
`);

/**
 * Bases creadas antes del índice parcial arrastran el UNIQUE(fecha, hora) de
 * tabla. SQLite no permite borrar una restricción, así que se reconstruye la
 * tabla conservando los datos.
 */
function migrarUniqueDeTurnos() {
  const definicion = db
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'turnos'")
    .get();
  if (!definicion || !/UNIQUE\s*\(\s*fecha\s*,\s*hora\s*\)/i.test(definicion.sql)) return;

  console.log('Migrando turnos: se quita UNIQUE(fecha, hora) de la tabla…');
  db.pragma('foreign_keys = OFF');
  db.transaction(() => {
    db.exec(`
      CREATE TABLE turnos_migracion (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
        servicio_id INTEGER NOT NULL REFERENCES servicios(id),
        fecha TEXT NOT NULL,
        hora TEXT NOT NULL,
        estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','confirmado','cancelado','completado')),
        metodo_pago TEXT,
        puntos_otorgados INTEGER,
        fecha_creacion TEXT NOT NULL DEFAULT (datetime('now'))
      );

      INSERT INTO turnos_migracion
        (id, usuario_id, servicio_id, fecha, hora, estado, metodo_pago, puntos_otorgados, fecha_creacion)
      SELECT id, usuario_id, servicio_id, fecha, hora, estado, metodo_pago, puntos_otorgados, fecha_creacion
      FROM turnos;

      DROP TABLE turnos;
      ALTER TABLE turnos_migracion RENAME TO turnos;

      CREATE INDEX IF NOT EXISTS idx_turnos_fecha ON turnos(fecha);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_turnos_horario_ocupado
        ON turnos(fecha, hora) WHERE estado IN ('pendiente','confirmado');
    `);
  })();
  db.pragma('foreign_keys = ON');

  const problemas = db.pragma('foreign_key_check');
  if (problemas.length) console.warn('Revisar claves foráneas tras la migración:', problemas);
  console.log('Migración de turnos lista.');
}

migrarUniqueDeTurnos();

module.exports = db;
