const express = require('express');
const db = require('../db/init');
const { requireAuth, requireDueño } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireDueño);

// Resumen: totales de hoy / semana / mes + comparativa ingresos vs gastos
router.get('/resumen', (req, res) => {
  const hoy = new Date().toISOString().slice(0, 10);

  const totalPeriodo = (desde) =>
    db
      .prepare(
        `SELECT
           COALESCE(SUM(CASE WHEN tipo='ingreso' THEN monto ELSE 0 END), 0) AS ingresos,
           COALESCE(SUM(CASE WHEN tipo='gasto' THEN monto ELSE 0 END), 0) AS gastos
         FROM movimientos_caja WHERE date(fecha) >= date(?)`
      )
      .get(desde);

  const inicioSemana = new Date();
  inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
  const inicioMes = hoy.slice(0, 7) + '-01';

  const dia = totalPeriodo(hoy);
  const semana = totalPeriodo(inicioSemana.toISOString().slice(0, 10));
  const mes = totalPeriodo(inicioMes);

  const turnosHoy = db
    .prepare("SELECT COUNT(*) AS c FROM turnos WHERE fecha = ? AND estado != 'cancelado'")
    .get(hoy).c;

  res.json({
    hoy: { ...dia, neto: dia.ingresos - dia.gastos, turnos: turnosHoy },
    semana: { ...semana, neto: semana.ingresos - semana.gastos },
    mes: { ...mes, neto: mes.ingresos - mes.gastos },
  });
});

// Detalle de movimientos, con filtro opcional por rango de fechas
router.get('/', (req, res) => {
  const { desde, hasta } = req.query;
  let sql = 'SELECT * FROM movimientos_caja WHERE 1=1';
  const params = [];
  if (desde) { sql += ' AND date(fecha) >= date(?)'; params.push(desde); }
  if (hasta) { sql += ' AND date(fecha) <= date(?)'; params.push(hasta); }
  sql += ' ORDER BY fecha DESC LIMIT 200';
  res.json(db.prepare(sql).all(...params));
});

// Serie diaria para gráfico (últimos N días, default 14)
router.get('/serie', (req, res) => {
  const dias = Number(req.query.dias) || 14;
  const filas = db
    .prepare(
      `SELECT date(fecha) AS fecha,
              COALESCE(SUM(CASE WHEN tipo='ingreso' THEN monto ELSE 0 END), 0) AS ingresos,
              COALESCE(SUM(CASE WHEN tipo='gasto' THEN monto ELSE 0 END), 0) AS gastos
       FROM movimientos_caja
       WHERE date(fecha) >= date('now', ?)
       GROUP BY date(fecha)
       ORDER BY date(fecha)`
    )
    .all(`-${dias} days`);
  res.json(filas);
});

// Carga manual de ingreso o gasto (ej: venta de producto suelto, alquiler, insumos)
router.post('/', (req, res) => {
  const { tipo, concepto, monto } = req.body;
  if (!['ingreso', 'gasto'].includes(tipo) || !concepto || !monto) {
    return res.status(400).json({ error: 'tipo (ingreso/gasto), concepto y monto son obligatorios' });
  }
  const info = db
    .prepare("INSERT INTO movimientos_caja (tipo, concepto, monto, origen) VALUES (?, ?, ?, 'manual')")
    .run(tipo, concepto, monto);
  res.status(201).json(db.prepare('SELECT * FROM movimientos_caja WHERE id = ?').get(info.lastInsertRowid));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM movimientos_caja WHERE id = ? AND origen = ?').run(req.params.id, 'manual');
  res.json({ ok: true });
});

module.exports = router;
