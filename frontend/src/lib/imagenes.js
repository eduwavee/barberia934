/**
 * Manejo de las fotos de productos.
 *
 * La foto se achica en el navegador antes de subirla: una foto de celular pesa
 * varios MB y se muestra en una tarjeta de 120 px. Achicarla antes ahorra datos
 * del que sube, tiempo de subida y espacio en el servidor.
 */

const LADO_MAXIMO = 700;
const CALIDAD = 0.85;

/** El API vive en /api; los archivos se sirven en la raíz del mismo servidor. */
export function urlDeArchivo(ruta) {
  if (!ruta) return null;
  if (/^https?:\/\//i.test(ruta)) return ruta;
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/api\/?$/, '');
  return `${base}${ruta}`;
}

/**
 * Devuelve un File más chico, listo para subir.
 * Si algo falla (un formato raro, por ejemplo), devuelve el original: mejor
 * subir la foto grande que no dejar subir nada.
 */
export async function achicarImagen(archivo, ladoMaximo = LADO_MAXIMO) {
  if (!archivo?.type?.startsWith('image/')) return archivo;

  try {
    const bitmap = await createImageBitmap(archivo);
    const escala = Math.min(1, ladoMaximo / Math.max(bitmap.width, bitmap.height));

    // Ya es chica: no vale la pena recomprimirla y perder calidad
    if (escala === 1 && archivo.size < 400_000) {
      bitmap.close?.();
      return archivo;
    }

    const ancho = Math.round(bitmap.width * escala);
    const alto = Math.round(bitmap.height * escala);
    const lienzo = document.createElement('canvas');
    lienzo.width = ancho;
    lienzo.height = alto;

    const ctx = lienzo.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, ancho, alto);
    bitmap.close?.();

    // PNG conserva la transparencia; el resto va a JPEG, que pesa mucho menos
    const tipo = archivo.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const blob = await new Promise((listo) => lienzo.toBlob(listo, tipo, CALIDAD));
    if (!blob || blob.size >= archivo.size) return archivo;

    return new File([blob], archivo.name.replace(/\.[^.]+$/, tipo === 'image/png' ? '.png' : '.jpg'), {
      type: tipo,
    });
  } catch {
    return archivo;
  }
}
