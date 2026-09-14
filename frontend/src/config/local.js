/**
 * Datos del local. Es el único lugar donde se tocan: la pantalla de Ubicación,
 * los enlaces de contacto y el mapa salen todos de acá.
 *
 * `lat` y `lng` son las coordenadas exactas del local. Para sacarlas: abrí
 * Google Maps, clic derecho sobre la puerta del local → "¿Qué hay aquí?" y
 * copiá los dos números que aparecen abajo.
 */
export const LOCAL = {
  nombre: 'Barbería 9 ¾',

  // Dirección tal como se muestra en la app
  calle: 'Av. San Martín 1234',
  ciudad: 'Río Cuarto, Córdoba',

  // Coordenadas del local (centro del mapa y destino del enlace a Maps)
  lat: -33.1232,
  lng: -64.3493,

  // Contacto. El teléfono va en formato internacional sin espacios ni signos.
  whatsapp: '5493585555555',
  instagram: 'barberia9.3.4',

  horarios: [
    { dias: 'Martes a viernes', horas: '15:00 — 23:00' },
    { dias: 'Sábados', horas: '10:00 — 20:00' },
  ],
};

/** Enlace a Google Maps, por coordenadas para que caiga en el punto exacto. */
export const enlaceMaps = () =>
  `https://www.google.com/maps/search/?api=1&query=${LOCAL.lat},${LOCAL.lng}`;

/** Enlace a WhatsApp con un mensaje ya escrito. */
export const enlaceWhatsapp = (
  mensaje = `¡Hola! Quiero consultar por un turno en ${LOCAL.nombre}.`,
) => `https://wa.me/${LOCAL.whatsapp}?text=${encodeURIComponent(mensaje)}`;

export const enlaceInstagram = () => `https://instagram.com/${LOCAL.instagram}`;

export const direccionCompleta = () => `${LOCAL.calle}, ${LOCAL.ciudad}`;
