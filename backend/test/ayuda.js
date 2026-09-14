/**
 * Utilidades para los tests.
 *
 * Cada corrida arranca con una base nueva en un archivo temporal, así los tests
 * nunca tocan los datos reales y no dependen del orden en que se ejecutan.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'barberia-test-'));

// Tiene que quedar seteado ANTES de requerir la app: db/init.js lo lee al cargar
process.env.DB_PATH = path.join(carpeta, 'prueba.db');
process.env.JWT_SECRET = 'secreto-de-prueba';
process.env.NODE_ENV = 'test';
delete process.env.VAPID_PUBLIC_KEY; // sin push en los tests
delete process.env.VAPID_PRIVATE_KEY;

const app = require('../server');
const db = require('../db/init');

let servidor;
let base;

/** Levanta la API en un puerto libre y devuelve su URL. */
async function arrancar() {
  if (base) return base;
  await new Promise((listo) => {
    servidor = app.listen(0, '127.0.0.1', listo);
  });
  base = `http://127.0.0.1:${servidor.address().port}/api`;
  return base;
}

async function apagar() {
  if (servidor) await new Promise((listo) => servidor.close(listo));
  try {
    db.close();
    fs.rmSync(carpeta, { recursive: true, force: true });
  } catch {
    // en Windows el archivo puede quedar tomado un instante; no afecta al test
  }
}

/** fetch con el token puesto y el JSON ya parseado. */
async function pedir(metodo, ruta, { token, cuerpo } = {}) {
  const respuesta = await fetch(`${base}${ruta}`, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const texto = await respuesta.text();
  let datos = null;
  try {
    datos = texto ? JSON.parse(texto) : null;
  } catch {
    datos = texto;
  }
  return { estado: respuesta.status, datos };
}

/** Datos mínimos para operar: servicios, horarios, productos y el dueño. */
function sembrar() {
  db.prepare(
    "INSERT INTO servicios (nombre, precio, duracion_min, puntos_otorgados) VALUES ('Corte', 6000, 30, 100)",
  ).run();
  db.prepare(
    "INSERT INTO servicios (nombre, precio, duracion_min, puntos_otorgados) VALUES ('Barba', 4000, 20, 80)",
  ).run();

  // Todos los días abiertos, para que las fechas del test siempre tengan agenda
  for (let dia = 0; dia < 7; dia += 1) {
    db.prepare(
      "INSERT INTO horarios_config (dia_semana, hora_inicio, hora_fin, intervalo_min) VALUES (?, '15:00', '20:00', 60)",
    ).run(dia);
  }

  db.prepare(
    "INSERT INTO productos_canje (nombre, puntos_requeridos, stock) VALUES ('Cera', 100, 2)",
  ).run();

  const bcrypt = require('bcryptjs');
  db.prepare(
    "INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ('Jacob', 'dueno@test.com', ?, 'dueño')",
  ).run(bcrypt.hashSync('secreta123', 8));
}

/** Registra un cliente y devuelve su token e id. */
async function crearCliente(email = 'cliente@test.com') {
  const { datos } = await pedir('POST', '/auth/register', {
    cuerpo: { nombre: 'Cliente Prueba', email, password: 'secreta123', telefono: '3811234567' },
  });
  return { token: datos.token, id: datos.usuario.id };
}

async function tokenDueño() {
  const { datos } = await pedir('POST', '/auth/login', {
    cuerpo: { email: 'dueno@test.com', password: 'secreta123' },
  });
  return datos.token;
}

/** Una fecha futura, para no chocar con turnos ya vencidos. */
function enDias(dias) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

module.exports = { arrancar, apagar, pedir, sembrar, crearCliente, tokenDueño, enDias, db };
