import { useCallback, useRef, useState } from 'react';

let proximaOnda = 0;

/**
 * Botón primario con una onda que sale del punto que tocaste.
 * Acepta las mismas props que un <button>.
 */
export default function BotonOnda({ className = '', onClick, children, ...resto }) {
  const [ondas, setOndas] = useState([]);
  const ref = useRef(null);

  const alTocar = useCallback(
    (e) => {
      const nodo = ref.current;
      if (nodo && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
        const caja = nodo.getBoundingClientRect();
        const lado = Math.max(caja.width, caja.height);
        const id = ++proximaOnda;
        setOndas((previas) => [
          ...previas,
          { id, x: e.clientX - caja.left - lado / 2, y: e.clientY - caja.top - lado / 2, lado },
        ]);
        // la animación dura 600ms; se limpia sola para no acumular nodos
        window.setTimeout(() => setOndas((previas) => previas.filter((o) => o.id !== id)), 600);
      }
      onClick?.(e);
    },
    [onClick],
  );

  return (
    <button ref={ref} onClick={alTocar} className={className} {...resto}>
      {ondas.map((o) => (
        <span
          key={o.id}
          className="onda-toque"
          style={{ left: o.x, top: o.y, width: o.lado, height: o.lado }}
        />
      ))}
      {children}
    </button>
  );
}
