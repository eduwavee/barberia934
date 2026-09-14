import Icono from './Icono';

/** Spinner con la tijera de la marca girando. */
export function Spinner({ size = 20, className = 'text-dorado' }) {
  return (
    <span className="inline-flex" role="status" aria-label="Cargando">
      <Icono nombre="tijera" size={size} className={`animate-girar ${className}`} />
    </span>
  );
}

/** Bloques grises que laten mientras llegan los datos. */
export function Esqueleto({ lineas = 3, className = '' }) {
  return (
    <div className={`flex flex-col gap-3 ${className}`} aria-hidden="true">
      {Array.from({ length: lineas }, (_, i) => (
        <div key={i} className="card">
          <div className="esqueleto h-4 w-1/2" />
          <div className="esqueleto h-3 w-3/4 mt-2" />
        </div>
      ))}
    </div>
  );
}

/** Estado vacío con icono, en lugar de una línea de texto suelta. */
export function Vacio({ icono = 'tijera', children }) {
  return (
    <div className="card text-center py-8 animate-aparecer-escala">
      <Icono nombre={icono} size={40} grosor={1.2} className="mx-auto text-dorado/50 animate-flotar" />
      <div className="mt-3 text-crema/60 text-sm">{children}</div>
    </div>
  );
}
