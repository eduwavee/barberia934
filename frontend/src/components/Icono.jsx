/**
 * Sistema de iconos de Barbería 9 ¾.
 *
 * Trazo fino y continuo, esquinas redondeadas y proporciones del sello de la
 * marca (negro + dorado + crema). Todos heredan el color con `currentColor`,
 * así que se pintan con las clases de texto de Tailwind (text-dorado, etc.).
 */

const trazos = {
  // --- Barra superior ---
  menu: <path d="M3.6 6.6h16.8M3.6 12h16.8M3.6 17.4h16.8" />,
  campana: (
    <>
      <path d="M12 3a6.2 6.2 0 0 0-6.2 6.2c0 3.6-1.4 4.9-2 5.6-.3.3-.1.9.4.9h15.6c.5 0 .7-.6.4-.9-.6-.7-2-2-2-5.6A6.2 6.2 0 0 0 12 3Z" />
      <path d="M9.8 19.2a2.3 2.3 0 0 0 4.4 0" />
    </>
  ),
  atras: <path d="M14.6 5.4 8 12l6.6 6.6" />,
  telefono: (
    <>
      <rect x="6.6" y="2.6" width="10.8" height="18.8" rx="2.4" />
      <path d="M10.8 18.6h2.4" />
    </>
  ),

  // --- Navegación ---
  inicio: (
    <>
      <path d="M3 10.6 12 3.2l9 7.4" />
      <path d="M5.4 9.4V20a.8.8 0 0 0 .8.8h11.6a.8.8 0 0 0 .8-.8V9.4" />
      <path d="M9.6 20.8v-5.4a2.4 2.4 0 0 1 4.8 0v5.4" />
    </>
  ),
  calendario: (
    <>
      <rect x="3.2" y="5.2" width="17.6" height="15.6" rx="2.4" />
      <path d="M3.2 10.2h17.6" />
      <path d="M8 3.2v4M16 3.2v4" />
      <path d="M7.6 14h2M11 14h2M14.4 14h2M7.6 17.4h2M11 17.4h2" />
    </>
  ),
  /** Estrella de 6 puntas: la figura central del sello. */
  estrella: <path d="M12 3 14.4 7.84 19.79 7.5 16.8 12l2.99 4.5-5.39-.34L12 21l-2.4-4.84-5.39.34L7.2 12 4.21 7.5l5.39.34Z" />,
  tarjeta: (
    <>
      <rect x="2.4" y="5.4" width="19.2" height="13.2" rx="2.4" />
      <path d="M2.4 9.8h19.2" />
      <path d="M6 14.6h3.4M12.4 14.6h1.8" />
    </>
  ),
  ubicacion: (
    <>
      <path d="M12 21.2s7.2-5.7 7.2-10.8a7.2 7.2 0 0 0-14.4 0C4.8 15.5 12 21.2 12 21.2Z" />
      <circle cx="12" cy="10.4" r="2.7" />
    </>
  ),

  // --- Barbería ---
  tijera: (
    <>
      <circle cx="6.4" cy="17.6" r="2.6" />
      <circle cx="17.6" cy="17.6" r="2.6" />
      <path d="M8.3 15.7 19.4 3.6M15.7 15.7 4.6 3.6" />
      <path d="M11 11.4 12 12.5" />
    </>
  ),
  navaja: (
    <>
      <path d="M3.3 16.2h3.9c1.3 0 2.5-.5 3.4-1.4L21.1 4.4c.4-.4.1-1.2-.5-1.2h-3.2c-1.3 0-2.5.5-3.4 1.4L2.8 15c-.4.4-.1 1.2.5 1.2Z" />
      <path d="M3.6 19.8h10.7a4.2 4.2 0 0 0 4.2-4.2v-2.2" />
    </>
  ),
  peine: (
    <>
      <rect x="3.2" y="6.2" width="17.6" height="4.2" rx="1.4" />
      <path d="M6.4 10.4v6.2M9.6 10.4v7.8M12.8 10.4v6.2M16 10.4v7.8M19.2 10.4v6.2" />
    </>
  ),

  // --- Puntos y canjes ---
  regalo: (
    <>
      <rect x="3.2" y="10.8" width="17.6" height="10" rx="1.6" />
      <path d="M2.2 7.4h19.6v3.4H2.2z" />
      <path d="M12 7.4v13.4" />
      <path d="M12 7.4S10.9 3 8.9 3a2.2 2.2 0 0 0 0 4.4M12 7.4S13.1 3 15.1 3a2.2 2.2 0 0 1 0 4.4" />
    </>
  ),
  trofeo: (
    <>
      <path d="M7.2 3.8h9.6v5.4a4.8 4.8 0 0 1-9.6 0Z" />
      <path d="M7.2 5.4H4.6v1.4a3.2 3.2 0 0 0 3 3.2M16.8 5.4h2.6v1.4a3.2 3.2 0 0 1-3 3.2" />
      <path d="M12 14v3.4M8.4 20.6h7.2l-.6-3.2H9z" />
    </>
  ),

  // --- Panel del dueño ---
  panel: (
    <>
      <rect x="3.2" y="3.2" width="7.4" height="7.4" rx="1.8" />
      <rect x="13.4" y="3.2" width="7.4" height="7.4" rx="1.8" />
      <rect x="3.2" y="13.4" width="7.4" height="7.4" rx="1.8" />
      <rect x="13.4" y="13.4" width="7.4" height="7.4" rx="1.8" />
    </>
  ),
  ingresos: (
    <>
      <path d="M3 17.6 9.6 11l4 4L21 7.6" />
      <path d="M15.4 7.6H21v5.6" />
    </>
  ),
  clientes: (
    <>
      <circle cx="9.2" cy="7.6" r="4" />
      <path d="M2.4 20.6a6.8 6.8 0 0 1 13.6 0" />
      <path d="M16.6 4a4 4 0 0 1 0 7.2M17.4 14.4a6.8 6.8 0 0 1 4.2 6.2" />
    </>
  ),
  reloj: (
    <>
      <circle cx="12" cy="12" r="8.8" />
      <path d="M12 6.8V12l3.4 2" />
    </>
  ),

  // --- Acciones y estados ---
  salir: (
    <>
      <path d="M14.6 8V6.2a1.8 1.8 0 0 0-1.8-1.8H5.6a1.8 1.8 0 0 0-1.8 1.8v11.6a1.8 1.8 0 0 0 1.8 1.8h7.2a1.8 1.8 0 0 0 1.8-1.8V16" />
      <path d="M9.6 12h10.6" />
      <path d="m17.2 8.8 3.2 3.2-3.2 3.2" />
    </>
  ),
  candado: (
    <>
      <rect x="4.6" y="10.4" width="14.8" height="10.2" rx="2.4" />
      <path d="M8 10.4V7.6a4 4 0 0 1 8 0v2.8" />
      <path d="M12 14.6v2.4" />
    </>
  ),
  cerrar: <path d="M6.2 6.2 17.8 17.8M17.8 6.2 6.2 17.8" />,
  check: <path d="m4.6 12.6 4.8 4.8L19.6 6.6" />,
  mas: <path d="M12 5.2v13.6M5.2 12h13.6" />,
  menos: <path d="M5.2 12h13.6" />,
  flecha: <path d="m9.4 5.4 6.6 6.6-6.6 6.6" />,
  mapa: (
    <>
      <path d="M9 4.4 3.2 6.8v12.8L9 17.2l6 2.4 5.8-2.4V4.4L15 6.8z" />
      <path d="M9 4.4v12.8M15 6.8v12.8" />
    </>
  ),
  instagram: (
    <>
      <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" />
      <circle cx="12" cy="12" r="3.9" />
      <path d="M17.2 6.9h.01" />
    </>
  ),
  whatsapp: (
    <>
      <path d="M20.4 11.6a8.4 8.4 0 0 1-12.5 7.3L3.6 20.4l1.5-4.2A8.4 8.4 0 1 1 20.4 11.6Z" />
      <path d="M9 8.8c-.3 1 .1 2.2.9 3.2.8 1 1.9 1.7 3 1.9l.9-1.2 1.8 1-.8 1.4c-1.6.3-3.4-.6-4.7-1.9s-2.1-3-1.9-4.6l1.4-.8z" />
    </>
  ),
  efectivo: (
    <>
      <rect x="2.4" y="6" width="19.2" height="12" rx="2.2" />
      <circle cx="12" cy="12" r="2.8" />
      <path d="M6 10.4v3.2M18 10.4v3.2" />
    </>
  ),
};

export default function Icono({
  nombre,
  size = 22,
  grosor = 1.5,
  /** Icono macizo en vez de contorno: se lee mejor por debajo de los 16px. */
  relleno = false,
  className = '',
  titulo,
  ...resto
}) {
  const trazo = trazos[nombre];
  if (!trazo) return null;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={relleno ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={relleno ? 0 : grosor}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={titulo ? 'img' : undefined}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : true}
      focusable="false"
      {...resto}
    >
      {titulo && <title>{titulo}</title>}
      {trazo}
    </svg>
  );
}

export const nombresDeIconos = Object.keys(trazos);
