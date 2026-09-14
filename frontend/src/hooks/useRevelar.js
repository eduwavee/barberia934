import { useCallback } from 'react';

/**
 * Revela un bloque cuando entra en pantalla al hacer scroll.
 *
 *   const revelar = useRevelar();
 *   <section ref={revelar} className="revelable">…</section>
 *
 * Devuelve un *callback ref*, no un ref común: así también funciona en bloques
 * que se montan más tarde (por ejemplo, después de que llegan los datos).
 *
 * El bloque arranca invisible, así que el revelado no puede fallar en silencio:
 * si el sistema pide menos movimiento, si no hay IntersectionObserver, o si el
 * observer no llega a dispararse, igual se muestra — por el chequeo inicial, el
 * respaldo atado al scroll y el temporizador de último recurso.
 */
export default function useRevelar({ margen = 0.12 } = {}) {
  return useCallback(
    (nodo) => {
      if (!nodo) return undefined;

      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
        nodo.classList.add('visible');
        return undefined;
      }

      let listo = false;
      let observador = null;
      let reloj = 0;

      const alScrollear = () => {
        const r = nodo.getBoundingClientRect();
        if (r.top < window.innerHeight * (1 - margen) && r.bottom > 0) mostrar();
      };

      const limpiar = () => {
        observador?.disconnect();
        window.removeEventListener('scroll', alScrollear);
        window.removeEventListener('resize', alScrollear);
        window.clearTimeout(reloj);
      };

      function mostrar() {
        if (listo) return;
        listo = true;
        nodo.classList.add('visible');
        limpiar();
      }

      if (typeof IntersectionObserver !== 'undefined') {
        observador = new IntersectionObserver(
          ([entrada]) => entrada.isIntersecting && mostrar(),
          { rootMargin: `0px 0px -${Math.round(margen * 100)}% 0px`, threshold: 0.05 },
        );
        observador.observe(nodo);
      }

      window.addEventListener('scroll', alScrollear, { passive: true });
      window.addEventListener('resize', alScrollear, { passive: true });
      reloj = window.setTimeout(mostrar, 1000);

      // Si ya nace a la vista, se revela en el próximo cuadro
      requestAnimationFrame(alScrollear);

      return limpiar;
    },
    [margen],
  );
}
