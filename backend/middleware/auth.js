const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no provisto' });
  }
  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload; // { id, rol, nombre }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

function requireDueño(req, res, next) {
  if (req.usuario?.rol !== 'dueño') {
    return res.status(403).json({ error: 'Acceso solo para el dueño de la barbería' });
  }
  next();
}

module.exports = { requireAuth, requireDueño };
