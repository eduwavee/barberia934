/**
 * Agenda del dueño: horarios de atención por día de la semana y bloqueos
 * puntuales (feriados, vacaciones o un turno que se guarda para él).
 */
const express = require('express');
const db = require('../db/init');
const { requireAuth, requireDueño } = require('../middleware/auth');
const { avisar, avisarATodos, clientesParaAvisar } = require('../lib/notificaciones');

const router = express.Router();

const NOMBRES_DIA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const HORA_VALIDA = /^([01]\d|2[0-3]):[0-5]\d$/;
const FECHA_VALIDA = /^\d{4}-\d{2}-\d{2}$/;

/** Horarios de atención de la semana (los 7 días, aunque estén cerrados). */
router.get('/horarios', requireAuth, requireDueño, (req, res) => {
  const filas = db.prepare('SELECT * FROM horarios_config ORDER BY dia_semana').all();
  const semana = NOMBRES_DIA.map((nombre, dia) => {
    const config = filas.find((f) => f.dia_semana === dia);
    return {
      dia_semana: dia,
      nombre,
      abierto: Boolean(config?.activo),
      hora_inicio: config?.hora_inicio ?? '15:00',
      hora_fin: config?.hora_fin ?? '23:00',
      intervalo_min: config?.intervalo_min ?? 60,
    };
  });
  res.json(semana);
});

/** Guarda el horario de un día. Con abierto=false el día queda cerrado. */
router.put('/horarios/:dia', requireAuth, requireDueño, (req, res) => {
  const dia = Number(req.params.dia);
  if (!Number.isInteger(dia) || dia < 0 || dia > 6) {
    return res.status(400).json({ error: 'Día inválido (0 = domingo … 6 = sábado)' });
  }

  const { abierto = true, hora_inicio, hora_fin, intervalo_min = 60 } = req.body || {};

  if (abierto) {
    if (!HORA_VALIDA.test(hora_inicio || '') || !HORA_VALIDA.test(hora_fin || '')) {
      return res.status(400).json({ error: 'Horas inválidas, se espera HH:MM' });
    }
    if (hora_fin <= hora_inicio) {
      return res.status(400).json({ error: 'La hora de cierre tiene que ser posterior a la de apertura' });
    }
    if (![15, 20, 30, 45, 60, 90].includes(Number(intervalo_min))) {
      return res.status(400).json({ error: 'Intervalo inválido' });
    }
  }

  const existente = db.prepare('SELECT id FROM horarios_config WHERE dia_semana = ?').get(dia);
  if (existente) {
    db.prepare(
      `UPDATE horarios_config
       SET hora_inicio = ?, hora_fin = ?, intervalo_min = ?, activo = ?
       WHERE dia_semana = ?`,
    ).run(hora_inicio ?? '15:00', hora_fin ?? '23:00', Number(intervalo_min), abierto ? 1 : 0, dia);
  } else {
    db.prepare(
      `INSERT INTO horarios_config (dia_semana, hora_inicio, hora_fin, intervalo_min, activo)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(dia, hora_inicio ?? '15:00', hora_fin ?? '23:00', Number(intervalo_min), abierto ? 1 : 0);
  }

  res.json({ ok: true });
});

/** Bloqueos vigentes (de hoy en adelante). */
router.get('/bloqueos', requireAuth, requireDueño, (req, res) => {
  const hoy = new Date().toISOString().slice(0, 10);
  res.json(
    db
      .prepare('SELECT * FROM bloqueos WHERE fecha >= ? ORDER BY fecha, hora')
      .all(hoy),
  );
});

/**
 * Cierra un día entero (sin hora) o un horario suelto.
 * Si había turnos activos ahí, se cancelan y se le avisa a cada cliente.
 */
router.post('/bloqueos', requireAuth, requireDueño, (req, res) => {
  const { fecha, hora = null, motivo = null } = req.body || {};
  if (!FECHA_VALIDA.test(fecha || '')) {
    return res.status(400).json({ error: 'Fecha inválida, se espera YYYY-MM-DD' });
  }
  if (hora && !HORA_VALIDA.test(hora)) {
    return res.status(400).json({ error: 'Hora inválida, se espera HH:MM' });
  }

  const repetido = hora
    ? db.prepare('SELECT id FROM bloqueos WHERE fecha = ? AND hora = ?').get(fecha, hora)
    : db.prepare('SELECT id FROM bloqueos WHERE fecha = ? AND hora IS NULL').get(fecha);
  if (repetido) return res.status(409).json({ error: 'Ese bloqueo ya existe' });

  const afectados = hora
    ? db
        .prepare(
          `SELECT t.id, t.usuario_id, t.hora, s.nombre AS servicio
           FROM turnos t JOIN servicios s ON s.id = t.servicio_id
           WHERE t.fecha = ? AND t.hora = ? AND t.estado IN ('pendiente','confirmado')`,
        )
        .all(fecha, hora)
    : db
        .prepare(
          `SELECT t.id, t.usuario_id, t.hora, s.nombre AS servicio
           FROM turnos t JOIN servicios s ON s.id = t.servicio_id
           WHERE t.fecha = ? AND t.estado IN ('pendiente','confirmado')`,
        )
        .all(fecha);

  db.transaction(() => {
    db.prepare('INSERT INTO bloqueos (fecha, hora, motivo) VALUES (?, ?, ?)').run(
      fecha,
      hora,
      motivo,
    );
    afectados.forEach((t) =>
      db.prepare("UPDATE turnos SET estado = 'cancelado' WHERE id = ?").run(t.id),
    );
  })();

  afectados.forEach((t) =>
    avisar({
      usuarioId: t.usuario_id,
      tipo: 'turno_cancelado',
      titulo: 'Tuvimos que cancelar tu turno',
      cuerpo: `${t.servicio} del ${fecha} a las ${t.hora}${motivo ? ` · ${motivo}` : ''}. Sacá otro cuando quieras.`,
      enlace: '/turnos',
    }),
  );

  res.status(201).json({ ok: true, turnos_cancelados: afectados.length });
});

router.delete('/bloqueos/:id', requireAuth, requireDueño, (req, res) => {
  const bloqueo = db.prepare('SELECT * FROM bloqueos WHERE id = ?').get(req.params.id);
  if (!bloqueo) return res.status(404).json({ error: 'Bloqueo no encontrado' });

  db.prepare('DELETE FROM bloqueos WHERE id = ?').run(req.params.id);

  // Se liberaron horarios: se le avisa a los clientes que no tienen turno activo.
  const conTurno = db
    .prepare("SELECT DISTINCT usuario_id FROM turnos WHERE estado IN ('pendiente','confirmado')")
    .all()
    .map((r) => r.usuario_id);

  avisarATodos(clientesParaAvisar({ excepto: conTurno }), {
    tipo: 'turnos_liberados',
    titulo: 'Se abrieron turnos',
    cuerpo: `Volvimos a atender el ${bloqueo.fecha}. Sacá el tuyo antes de que se llene.`,
    enlace: '/turnos',
  });

  res.json({ ok: true });
});

module.exports = router;
