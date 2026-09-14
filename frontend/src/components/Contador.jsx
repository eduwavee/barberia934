import { useEffect, useRef, useState } from 'react';

const prefiereMenosMovimiento = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Número que sube desde 0 hasta `valor` con desaceleración.
 * Se usa para los puntos del cliente y los totales del panel.
 */
export default function Contador({ valor = 0, duracion = 900, className = '', formato }) {
  const [mostrado, setMostrado] = useState(0);
  const frameRef = useRef(null);

  useEffect(() => {
    const destino = Number(valor) || 0;

    if (prefiereMenosMovimiento() || destino === 0) {
      setMostrado(destino);
      return undefined;
    }

    const inicio = performance.now();
    const animar = (ahora) => {
      const avance = Math.min((ahora - inicio) / duracion, 1);
      const suavizado = 1 - Math.pow(1 - avance, 3); // easeOutCubic
      setMostrado(Math.round(destino * suavizado));
      if (avance < 1) frameRef.current = requestAnimationFrame(animar);
    };
    frameRef.current = requestAnimationFrame(animar);

    return () => cancelAnimationFrame(frameRef.current);
  }, [valor, duracion]);

  return <span className={className}>{formato ? formato(mostrado) : mostrado}</span>;
}
