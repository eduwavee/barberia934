// Carga datos iniciales de ejemplo: servicios, horarios y productos canjeables
const bcrypt = require('bcryptjs');
const db = require('./init');

const servicios = [
  { nombre: 'Corte clásico', precio: 6000, duracion_min: 30, puntos_otorgados: 100 },
  { nombre: 'Corte + barba', precio: 9000, duracion_min: 45, puntos_otorgados: 150 },
  { nombre: 'Barba', precio: 4000, duracion_min: 20, puntos_otorgados: 80 },
  { nombre: 'Corte niño', precio: 5000, duracion_min: 30, puntos_otorgados: 100 },
];

const insertServicio = db.prepare(`INSERT INTO servicios (nombre, precio, duracion_min, puntos_otorgados) VALUES (@nombre, @precio, @duracion_min, @puntos_otorgados)`);
const countServicios = db.prepare(`SELECT COUNT(*) AS c FROM servicios`).get().c;
if (countServicios === 0) {
  const tx = db.transaction((rows) => rows.forEach((r) => insertServicio.run(r)));
  tx(servicios);
  console.log(`Servicios cargados: ${servicios.length}`);
}

// Horarios: martes a sábado, 15:00 a 23:00, turnos cada 60 min
const insertHorario = db.prepare(`INSERT INTO horarios_config (dia_semana, hora_inicio, hora_fin, intervalo_min) VALUES (@dia, @inicio, @fin, @intervalo)`);
const countHorarios = db.prepare(`SELECT COUNT(*) AS c FROM horarios_config`).get().c;
if (countHorarios === 0) {
  const dias = [2, 3, 4, 5, 6]; // martes(2) a sábado(6)
  const tx = db.transaction((lista) => lista.forEach((dia) => insertHorario.run({ dia, inicio: '15:00', fin: '23:00', intervalo: 60 })));
  tx(dias);
  console.log(`Horarios cargados para ${dias.length} días`);
}

const productos = [
  { nombre: 'Cera para el pelo', puntos_requeridos: 300, stock: 20 },
  { nombre: 'Polvo texturizante', puntos_requeridos: 300, stock: 15 },
  { nombre: 'Aceite para barba', puntos_requeridos: 400, stock: 10 },
];
const insertProducto = db.prepare(`INSERT INTO productos_canje (nombre, puntos_requeridos, stock) VALUES (@nombre, @puntos_requeridos, @stock)`);
const countProductos = db.prepare(`SELECT COUNT(*) AS c FROM productos_canje`).get().c;
if (countProductos === 0) {
  const tx = db.transaction((rows) => rows.forEach((r) => insertProducto.run(r)));
  tx(productos);
  console.log(`Productos canjeables cargados: ${productos.length}`);
}

// Usuario dueño de ejemplo
const emailDueño = 'jacob@barberia93cuartos.com';
const existeDueño = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(emailDueño);
if (!existeDueño) {
  const hash = bcrypt.hashSync('barberia123', 10);
  db.prepare(`INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, 'dueño')`)
    .run('Jacob Ruiz', emailDueño, hash);
  console.log(`Usuario dueño creado -> ${emailDueño} / barberia123 (cambiar en producción)`);
}

console.log('Seed completo.');
