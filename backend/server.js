require('dotenv').config();
const express = require('express');
const cors = require('cors');

require('./db/init'); // asegura que las tablas existan al arrancar

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/servicios', require('./routes/servicios'));
app.use('/api/turnos', require('./routes/turnos'));
app.use('/api/puntos', require('./routes/puntos'));
app.use('/api/ingresos', require('./routes/ingresos'));
app.use('/api/usuarios', require('./routes/usuarios'));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API Barbería 9 3/4 corriendo en http://localhost:${PORT}`));
