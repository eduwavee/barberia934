const express = require('express');
const db = require('../db/init');
const { requireAuth, requireDueño } = require('../middleware/auth');
const {
  avisar,
  avisarATodos,
  clientesParaAvisar,
  avisarSiPuedeCanjear,
} = require('../lib/notificaciones');

const router = express.Router();

function diaSemana(fechaStr) {
  // fechaStr 'YYYY-MM-DD' -> 0=domingo..6=sábado, evitando líos de timezone
  const [y, m, d] = fechaStr.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

function generarHorarios(hora_inicio, hora_fin, intervalo_min) {
  const horarios = [];
  let [h, m] = hora_inicio.split(':').map(Number);
  const [hf, mf] = hora_fin.split(':').map(Number);
  while (h < hf || (h === hf && m < mf)) {
    horarios.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    m += intervalo_min;
    while (m >= 60) { m -= 60; h += 1; }
  }
  return horarios;
}

// Horarios disponibles para una fecha dada
router.get('/disponibilidad', (req, res) => {
  const { fecha } = req.query;
  if (!fecha) return res.status(400).json({ error: 'Falta el parámetro fecha (YYYY-MM-DD)' });

  const dia = diaSemana(fecha);
  const config = db.prepare('SELECT * FROM horarios_config WHERE dia_semana = ? AND activo = 1').get(dia);
  if (!config) return res.json({ fecha, horarios: [], motivo: 'cerrado' }); // día cerrado

  // El dueño puede haber cerrado el día entero (bloqueo sin hora)
  const diaBloqueado = db.prepare('SELECT motivo FROM bloqueos WHERE fecha = ? AND hora IS NULL').get(fecha);
  if (diaBloqueado) {
    return res.json({ fecha, horarios: [], motivo: diaBloqueado.motivo || 'cerrado' });
  }

  const todos = generarHorarios(config.hora_inicio, config.hora_fin, config.intervalo_min);
  const ocupados = db
    .prepare("SELECT hora FROM turnos WHERE fecha = ? AND estado IN ('pendiente','confirmado')")
    .all(fecha)
    .map((r) => r.hora);
  const bloqueados = db
    .prepare('SELECT hora FROM bloqueos WHERE fecha = ? AND hora IS NOT NULL')
    .all(fecha)
    .map((r) => r.hora);

  const libres = todos.filter((h) => !ocupados.includes(h) && !bloqueados.includes(h));
  res.json({ fecha, horarios: libres });
});

// Reservar turno (cliente)
router.post('/', requireAuth, (req, res) => {
  const { servicio_id, fecha, hora, metodo_pago } = req.body;
  if (!servicio_id || !fecha || !hora) {
    return res.status(400).json({ error: 'servicio_id, fecha y hora son obligatorios' });
  }
  const servicio = db.prepare('SELECT * FROM servicios WHERE id = ? AND activo = 1').get(servicio_id);
  if (!servicio) return res.status(404).json({ error: 'Servicio no encontrado' });

  const bloqueado = db
    .prepare('SELECT id FROM bloqueos WHERE fecha = ? AND (hora = ? OR hora IS NULL)')
    .get(fecha, hora);
  if (bloqueado) return res.status(409).json({ error: 'Ese horario no está disponible' });

  const ocupado = db
    .prepare("SELECT id FROM turnos WHERE fecha = ? AND hora = ? AND estado IN ('pendiente','confirmado')")
    .get(fecha, hora);
  if (ocupado) return res.status(409).json({ error: 'Ese horario ya fue reservado' });

  let info;
  try {
    info = db
      .prepare('INSERT INTO turnos (usuario_id, servicio_id, fecha, hora, metodo_pago) VALUES (?, ?, ?, ?, ?)')
      .run(req.usuario.id, servicio_id, fecha, hora, metodo_pago || null);
  } catch (err) {
    // Dos clientes tocando el mismo horario a la vez: el índice único lo frena
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Ese horario ya fue reservado' });
    }
    throw err;
  }

  const turno = db.prepare('SELECT * FROM turnos WHERE id = ?').get(info.lastInsertRowid);

  avisar({
    usuarioId: req.usuario.id,
    tipo: 'turno_reservado',
    titulo: 'Turno reservado',
    cuerpo: `${servicio.nombre} el ${fecha} a las ${hora}. Te avisamos cuando lo confirmemos.`,
    enlace: '/turnos/mios',
  });

  res.status(201).json(turno);
});

// Turnos del cliente autenticado
router.get('/mios', requireAuth, (req, res) => {
  const turnos = db
    .prepare(
      `SELECT t.*, s.nombre AS servicio_nombre, s.precio
       FROM turnos t JOIN servicios s ON s.id = t.servicio_id
       WHERE t.usuario_id = ? ORDER BY t.fecha DESC, t.hora DESC`
    )
    .all(req.usuario.id);
  res.json(turnos);
});

// Listado completo (dueño), con filtros opcionales
router.get('/', requireAuth, requireDueño, (req, res) => {
  const { fecha, estado } = req.query;
  let sql = `SELECT t.*, s.nombre AS servicio_nombre, s.precio, u.nombre AS cliente_nombre, u.telefono AS cliente_telefono
             FROM turnos t
             JOIN servicios s ON s.id = t.servicio_id
             JOIN usuarios u ON u.id = t.usuario_id
             WHERE 1=1`;
  const params = [];
  if (fecha) { sql += ' AND t.fecha = ?'; params.push(fecha); }
  if (estado) { sql += ' AND t.estado = ?'; params.push(estado); }
  sql += ' ORDER BY t.fecha DESC, t.hora DESC';
  res.json(db.prepare(sql).all(...params));
});

// Cambiar estado de un turno (dueño): confirmar / completar / cancelar
// Al completar: otorga puntos al cliente y registra el ingreso en caja
router.put('/:id/estado', requireAuth, requireDueño, (req, res) => {
  const { estado } = req.body;
  const validos = ['pendiente', 'confirmado', 'cancelado', 'completado'];
  if (!validos.includes(estado)) return res.status(400).json({ error: 'Estado inválido' });

  const turno = db.prepare('SELECT * FROM turnos WHERE id = ?').get(req.params.id);
  if (!turno) return res.status(404).json({ error: 'Turno no encontrado' });

  const yaCompletado = turno.estado === 'completado';

  const tx = db.transaction(() => {
    db.prepare('UPDATE turnos SET estado = ? WHERE id = ?').run(estado, req.params.id);

    if (estado === 'completado' && !yaCompletado) {
      const servicio = db.prepare('SELECT * FROM servicios WHERE id = ?').get(turno.servicio_id);
      db.prepare('UPDATE turnos SET puntos_otorgados = ? WHERE id = ?').run(servicio.puntos_otorgados, turno.id);
      db.prepare('UPDATE usuarios SET puntos = puntos + ? WHERE id = ?').run(servicio.puntos_otorgados, turno.usuario_id);

      db.prepare(
        'INSERT INTO pagos (turno_id, usuario_id, monto, metodo, estado) VALUES (?, ?, ?, ?, ?)'
      ).run(turno.id, turno.usuario_id, servicio.precio, turno.metodo_pago || 'efectivo', 'pagado');

      db.prepare(
        "INSERT INTO movimientos_caja (tipo, concepto, monto, origen, turno_id) VALUES ('ingreso', ?, ?, 'turno', ?)"
      ).run(`Corte: ${servicio.nombre}`, servicio.precio, turno.id);
    }
  });
  tx();

  const servicio = db.prepare('SELECT nombre FROM servicios WHERE id = ?').get(turno.servicio_id);
  const cuando = `${turno.fecha} a las ${turno.hora}`;

  if (estado === 'confirmado' && turno.estado !== 'confirmado') {
    avisar({
      usuarioId: turno.usuario_id,
      tipo: 'turno_confirmado',
      titulo: 'Tu turno quedó confirmado',
      cuerpo: `${servicio.nombre} el ${cuando}. ¡Te esperamos!`,
      enlace: '/turnos/mios',
    });
  }

  if (estado === 'cancelado' && turno.estado !== 'cancelado') {
    avisar({
      usuarioId: turno.usuario_id,
      tipo: 'turno_cancelado',
      titulo: 'Tu turno fue cancelado',
      cuerpo: `${servicio.nombre} del ${cuando}. Podés sacar otro cuando quieras.`,
      enlace: '/turnos',
    });
    avisarHorarioLiberado(turno, [turno.usuario_id]);
  }

  if (estado === 'completado' && !yaCompletado) {
    const puntos = db.prepare('SELECT puntos_otorgados FROM turnos WHERE id = ?').get(turno.id);
    avisar({
      usuarioId: turno.usuario_id,
      tipo: 'puntos_sumados',
      titulo: `Sumaste ${puntos.puntos_otorgados} puntos`,
      cuerpo: `Gracias por venir. Ya están acreditados en tu cuenta.`,
      enlace: '/puntos',
    });
    avisarSiPuedeCanjear(turno.usuario_id);
  }

  res.json(db.prepare('SELECT * FROM turnos WHERE id = ?').get(req.params.id));
});

// Cancelar turno (cliente cancela el suyo, o dueño cualquiera)
router.delete('/:id', requireAuth, (req, res) => {
  const turno = db.prepare('SELECT * FROM turnos WHERE id = ?').get(req.params.id);
  if (!turno) return res.status(404).json({ error: 'Turno no encontrado' });
  if (req.usuario.rol !== 'dueño' && turno.usuario_id !== req.usuario.id) {
    return res.status(403).json({ error: 'No podés cancelar el turno de otro cliente' });
  }
  if (turno.estado === 'cancelado') return res.json({ ok: true });

  db.prepare("UPDATE turnos SET estado = 'cancelado' WHERE id = ?").run(req.params.id);
  avisarHorarioLiberado(turno, [turno.usuario_id]);
  res.json({ ok: true });
});

/**
 * Un horario que se libera le sirve a quien todavía no tiene turno: se les avisa
 * a esos clientes, salvo a los excluidos (el que acaba de cancelar).
 */
function avisarHorarioLiberado(turno, excepto = []) {
  const hoy = new Date().toISOString().slice(0, 10);
  if (turno.fecha < hoy) return; // un turno pasado no libera nada

  const conTurno = db
    .prepare("SELECT DISTINCT usuario_id FROM turnos WHERE estado IN ('pendiente','confirmado')")
    .all()
    .map((r) => r.usuario_id);

  avisarATodos(clientesParaAvisar({ excepto: [...conTurno, ...excepto] }), {
    tipo: 'turno_liberado',
    titulo: 'Se liberó un turno',
    cuerpo: `Quedó libre el ${turno.fecha} a las ${turno.hora}. Es tuyo si lo tomás ahora.`,
    enlace: '/turnos',
  });
}

/**
 * Turnos del día siguiente, para que el dueño mande los recordatorios.
 * Devuelve el teléfono y el texto del mensaje ya armado.
 */
router.get('/recordatorios', requireAuth, requireDueño, (req, res) => {
  const cuando = new Date();
  cuando.setDate(cuando.getDate() + Number(req.query.dias ?? 1));
  const fecha = cuando.toISOString().slice(0, 10);

  const turnos = db
    .prepare(
      `SELECT t.id, t.hora, t.estado, s.nombre AS servicio_nombre,
              u.nombre AS cliente_nombre, u.telefono AS cliente_telefono
       FROM turnos t
       JOIN servicios s ON s.id = t.servicio_id
       JOIN usuarios u ON u.id = t.usuario_id
       WHERE t.fecha = ? AND t.estado IN ('pendiente','confirmado')
       ORDER BY t.hora`,
    )
    .all(fecha);

  res.json({
    fecha,
    turnos: turnos.map((t) => ({
      ...t,
      mensaje:
        `¡Hola ${t.cliente_nombre.split(' ')[0]}! Te recordamos tu turno en Barbería 9 ¾: ` +
        `${t.servicio_nombre}, mañana ${fecha} a las ${t.hora}. ` +
        `Si no podés venir, avisanos así liberamos el horario. ¡Gracias!`,
    })),
  });
});

module.exports = router;
