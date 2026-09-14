import { lazy, Suspense } from 'react';
import { useAuth } from '../context/AuthContext';
import BottomNav from '../components/BottomNav';
import Encabezado from '../components/Encabezado';
import Pantalla from '../components/Pantalla';
import Icono from '../components/Icono';
import useRevelar from '../hooks/useRevelar';
import {
  LOCAL,
  enlaceMaps,
  enlaceWhatsapp,
  enlaceInstagram,
} from '../config/local';
import qr from '../assets/qr.png';

// Leaflet pesa ~45 KB comprimido y sólo se usa acá: se baja recién al abrir
// esta pantalla, no en el arranque de la app.
const MapaLocal = lazy(() => import('../components/MapaLocal'));

export default function Ubicacion() {
  const { usuario, logout } = useAuth();
  const refHorarios = useRevelar();
  const refQR = useRevelar();
  const refContacto = useRevelar();

  return (
    <Pantalla className="max-w-md mx-auto pb-28">
      <Encabezado titulo="Ubicación" volverA="/" />

      <div className="px-5 pt-5">
        {/* Mapa, dirección y acceso a Maps van juntos en una sola tarjeta */}
        <div className="card p-3 animate-aparecer-escala">
          <Suspense fallback={<div className="esqueleto h-52 w-full rounded-xl" />}>
            <MapaLocal className="h-52 w-full rounded-xl overflow-hidden" />
          </Suspense>

          <a
            href={enlaceMaps()}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-3 px-2 py-4"
          >
            <Icono nombre="ubicacion" size={21} className="text-dorado shrink-0" />
            <div className="flex-1">
              <p className="text-[15px] font-medium">{LOCAL.calle}</p>
              <p className="text-crema/55 text-[13px] mt-0.5">{LOCAL.ciudad}</p>
            </div>
            <Icono
              nombre="flecha"
              size={17}
              className="text-crema/35 transition-transform duration-300 group-hover:translate-x-1"
            />
          </a>

          <a href={enlaceMaps()} target="_blank" rel="noreferrer" className="btn-dorado block w-full">
            ABRIR EN GOOGLE MAPS
          </a>
        </div>

        {/* Horarios de atención */}
        <div ref={refHorarios} className="revelable card mt-4">
          <p className="rotulo-tenue mb-3 flex items-center gap-2">
            <Icono nombre="reloj" size={15} className="text-dorado" />
            Horarios de atención
          </p>
          <div className="flex flex-col gap-2.5">
            {LOCAL.horarios.map((h) => (
              <p key={h.dias} className="flex justify-between text-[14px]">
                <span className="text-crema/60">{h.dias}</span>
                <span className="font-medium">{h.horas}</span>
              </p>
            ))}
          </div>
        </div>

        {/* QR, enmarcado con los postes de barbero */}
        <div
          ref={refQR}
          className="revelable card relative mt-4 overflow-hidden px-10 py-6 text-center"
        >
          <span className="poste-barbero absolute left-3 top-6 bottom-6 w-[22px]" />
          <span className="poste-barbero absolute right-3 top-6 bottom-6 w-[22px]" />

          <div className="filete-tijera mb-4">
            <Icono nombre="tijera" size={19} />
          </div>

          <p className="text-[19px] font-bold">Escaneá el QR</p>
          <p className="text-crema/55 text-[13px] mt-1">y accedé a la app</p>

          <div className="mt-5 mx-auto w-[168px] rounded-2xl bg-white p-3 shadow-tarjeta transition-transform duration-500 hover:scale-105">
            <img src={qr} alt={`Código QR de ${LOCAL.nombre}`} className="w-full" />
          </div>

          <p className="mt-5 inline-flex items-center gap-2.5 rounded-full bg-dorado px-4 py-2.5 text-[12px] font-medium leading-tight text-negro">
            <Icono nombre="telefono" size={15} className="shrink-0" />
            También podés escanearlo
            <br />
            desde el local
          </p>
        </div>

        {/* Contacto */}
        <div ref={refContacto} className="revelable flex flex-col gap-2 mt-4">
          <a
            href={enlaceWhatsapp()}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-3 rounded-2xl border border-dorado/20 bg-panel px-4 py-3.5
                       text-sm transition-all duration-300 hover:border-dorado/50"
          >
            <Icono nombre="whatsapp" size={19} className="text-dorado" />
            Escribinos por WhatsApp
            <Icono
              nombre="flecha"
              size={14}
              className="ml-auto text-crema/30 transition-transform duration-300 group-hover:translate-x-1"
            />
          </a>
          <a
            href={enlaceInstagram()}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-3 rounded-2xl border border-dorado/20 bg-panel px-4 py-3.5
                       text-sm transition-all duration-300 hover:border-dorado/50"
          >
            <Icono nombre="instagram" size={19} className="text-dorado" />
            @{LOCAL.instagram}
            <Icono
              nombre="flecha"
              size={14}
              className="ml-auto text-crema/30 transition-transform duration-300 group-hover:translate-x-1"
            />
          </a>
        </div>

        {/* Firma de marca del pie de la referencia */}
        <p className="font-display italic text-center text-dorado/70 text-[15px] mt-8 leading-relaxed">
          Más que un corte,
          <br />
          es un estilo de vida
        </p>

        {usuario && (
          <button
            onClick={logout}
            className="group btn-outline w-full mt-7 inline-flex items-center justify-center gap-2"
          >
            <Icono
              nombre="salir"
              size={17}
              className="transition-transform duration-300 group-hover:translate-x-0.5"
            />
            CERRAR SESIÓN
          </button>
        )}
      </div>

      <BottomNav />
    </Pantalla>
  );
}
