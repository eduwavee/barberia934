import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LOCAL } from '../config/local';

/**
 * Mapa real del local, con tiles oscuros para que combine con el diseño.
 *
 * El zoom con la rueda queda apagado a propósito: si no, al hacer scroll en el
 * celular el dedo engancha el mapa en vez de mover la página. Se puede arrastrar
 * y usar los botones de + / −.
 */
export default function MapaLocal({ className = '' }) {
  const contenedor = useRef(null);

  useEffect(() => {
    const nodo = contenedor.current;
    if (!nodo) return undefined;

    const mapa = L.map(nodo, {
      center: [LOCAL.lat, LOCAL.lng],
      zoom: 16,
      scrollWheelZoom: false,
      attributionControl: true,
    });

    // Tiles de OpenStreetMap: libres y sin API key. Vienen claros, así que se
    // oscurecen por CSS (ver .leaflet-tile-pane en index.css) para que combinen
    // con el diseño.
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(mapa);

    // Pin con la forma y el dorado de la marca
    const pin = L.divIcon({
      className: 'pin-barberia',
      html: `
        <svg viewBox="0 0 24 24" width="38" height="38" fill="#C9AE8C"
             stroke="#0A0A0A" stroke-width="1.1" aria-hidden="true">
          <path d="M12 22.5s7.6-6 7.6-11.4a7.6 7.6 0 0 0-15.2 0C4.4 16.5 12 22.5 12 22.5Z"/>
          <circle cx="12" cy="10.8" r="2.8" fill="#0A0A0A" stroke="none"/>
        </svg>`,
      iconSize: [38, 38],
      iconAnchor: [19, 36],
      popupAnchor: [0, -32],
    });

    L.marker([LOCAL.lat, LOCAL.lng], { icon: pin, title: LOCAL.nombre })
      .addTo(mapa)
      .bindPopup(`<b>${LOCAL.nombre}</b><br>${LOCAL.calle}`);

    // El mapa puede montarse antes de que el contenedor tenga tamaño (venimos
    // de un Suspense): ahí Leaflet calcula mal las posiciones y el pin queda
    // corrido. Cada vez que cambia el tamaño —incluida la primera medición y el
    // giro del teléfono— se recalcula y se vuelve a centrar.
    const reencuadrar = () => {
      mapa.invalidateSize({ animate: false });
      mapa.setView([LOCAL.lat, LOCAL.lng], mapa.getZoom(), { animate: false });
    };

    const observador =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(reencuadrar) : null;
    observador?.observe(nodo);
    const reloj = window.setTimeout(reencuadrar, 250);

    return () => {
      window.clearTimeout(reloj);
      observador?.disconnect();
      mapa.remove();
    };
  }, []);

  return (
    <div
      ref={contenedor}
      className={className}
      role="application"
      aria-label={`Mapa de ${LOCAL.nombre}`}
    />
  );
}
