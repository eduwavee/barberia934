/**
 * Subida de imágenes de productos canjeables.
 *
 * Las fotos van a disco (backend/uploads) y en la base queda sólo la ruta.
 * El nombre del archivo lo genera el servidor: nunca se usa el que manda el
 * cliente, porque puede traer rutas ("../") o extensiones engañosas.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const CARPETA = path.join(__dirname, '..', 'uploads');
const LIMITE_BYTES = 3 * 1024 * 1024; // 3 MB: el frontend ya achica antes de subir

const TIPOS = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

fs.mkdirSync(CARPETA, { recursive: true });

const almacenamiento = multer.diskStorage({
  destination: (req, file, cb) => cb(null, CARPETA),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${TIPOS[file.mimetype]}`),
});

const subirImagen = multer({
  storage: almacenamiento,
  limits: { fileSize: LIMITE_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!TIPOS[file.mimetype]) {
      return cb(new Error('Sólo se aceptan imágenes JPG, PNG o WebP'));
    }
    cb(null, true);
  },
});

/** Borra una imagen anterior. No falla si el archivo ya no está. */
function borrarImagen(ruta) {
  if (!ruta) return;
  // Sólo se borra dentro de la carpeta de subidas, por las dudas
  const nombre = path.basename(ruta);
  const completa = path.join(CARPETA, nombre);
  if (!completa.startsWith(CARPETA)) return;
  fs.rm(completa, { force: true }, () => {});
}

module.exports = { subirImagen, borrarImagen, CARPETA, LIMITE_BYTES };
