require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

require('./db/init'); // asegura que las tablas existan al arrancar

const app = express();

// Detrás de un proxy (Railway, Render, Nginx) el IP real viene en X-Forwarded-For.
// Sin esto el límite de intentos vería a todos los clientes como uno solo.
app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

/*
 * CORS acotado. ORIGENES_PERMITIDOS es una lista separada por comas con los
 * dominios del frontend; sin esa variable sólo se acepta el Vite local.
 *
 * Se rechaza lo que no esté en la lista en vez de aceptar cualquier origen: la
 * API viaja con el token del cliente, y abierta a todos cualquier sitio podría
 * usarla en su nombre.
 */
const origenesPorDefecto = ['http://localhost:5173', 'http://127.0.0.1:5173'];
const origenesPermitidos = (process.env.ORIGENES_PERMITIDOS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)
  .concat(origenesPorDefecto);

app.use(
  cors({
    origin(origen, cb) {
      // Sin origen = curl, apps nativas o healthchecks: se dejan pasar
      if (!origen || origenesPermitidos.includes(origen)) return cb(null, true);
      cb(new Error(`Origen no permitido: ${origen}`));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: '100kb' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/servicios', require('./routes/servicios'));
app.use('/api/turnos', require('./routes/turnos'));
app.use('/api/puntos', require('./routes/puntos'));
app.use('/api/ingresos', require('./routes/ingresos'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/notificaciones', require('./routes/notificaciones'));
app.use('/api/agenda', require('./routes/agenda'));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  if (err?.message?.startsWith('Origen no permitido')) {
    return res.status(403).json({ error: 'Origen no permitido' });
  }
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Al importarlo desde los tests no se levanta el servidor
if (require.main === module) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => console.log(`API Barbería 9 3/4 corriendo en http://localhost:${PORT}`));
}

module.exports = app;
