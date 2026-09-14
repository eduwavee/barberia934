import { useAuth } from '../context/AuthContext';
import BottomNav from '../components/BottomNav';
import Encabezado from '../components/Encabezado';
import Icono from '../components/Icono';
import mapa from '../assets/mapa.jpg';
import qr from '../assets/qr.png';

const LOCAL = {
  calle: 'Av. San Martín 1234',
  ciudad: 'Río Cuarto, Córdoba',
  maps: 'https://www.google.com/maps/search/?api=1&query=Av.+San+Mart%C3%ADn+1234,+R%C3%ADo+Cuarto,+C%C3%B3rdoba',
  instagram: 'https://instagram.com/barberia9.3.4',
};

export default function Ubicacion() {
  const { usuario, logout } = useAuth();

  return (
    <div className="max-w-md mx-auto pb-28">
      <Encabezado titulo="Ubicación" volverA="/" />

      <div className="px-5 pt-5">
        {/* Mapa */}
        <div className="relative h-44 rounded-2xl overflow-hidden border border-borde animate-aparecer-escala">
          <img src={mapa} alt="Mapa del local" className="h-full w-full object-cover" />
          <span
            className="absolute left-1/2 -translate-x-1/2 bottom-3 flex items-center gap-1.5 rounded-full
                       bg-negro/75 backdrop-blur px-3 py-1.5 text-[11px] text-crema/90"
          >
            <Icono nombre="ubicacion" size={13} className="text-dorado" />
            Barbería 9 ¾
          </span>
        </div>

        {/* Dirección */}
        <a
          href={LOCAL.maps}
          target="_blank"
          rel="noreferrer"
          className="card group flex items-center gap-3 mt-3 hover:border-dorado/50"
        >
          <Icono nombre="ubicacion" size={20} className="text-dorado shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">{LOCAL.calle}</p>
            <p className="text-crema/50 text-xs mt-0.5">{LOCAL.ciudad}</p>
          </div>
          <Icono
            nombre="flecha"
            size={16}
            className="text-crema/35 transition-transform duration-300 group-hover:translate-x-1"
          />
        </a>

        <a
          href={LOCAL.maps}
          target="_blank"
          rel="noreferrer"
          className="btn-dorado block w-full mt-3"
        >
          ABRIR EN GOOGLE MAPS
        </a>

        {/* QR, enmarcado con el poste de barbero */}
        <div className="relative mt-4 rounded-2xl overflow-hidden border border-borde bg-panel animate-aparecer">
          <span className="poste-barbero absolute left-0 top-0 bottom-0 w-3 opacity-70" />
          <span className="poste-barbero absolute right-0 top-0 bottom-0 w-3 opacity-70" />

          <div className="px-9 py-6 text-center">
            <p className="font-semibold flex items-center justify-center gap-2">
              <Icono nombre="tijera" size={17} className="text-dorado" />
              Escaneá el QR
            </p>
            <p className="text-crema/50 text-xs mt-1">y accedé a la app</p>

            <div className="mt-4 mx-auto w-[150px] rounded-lg bg-white p-2.5">
              <img src={qr} alt="Código QR de Barbería 9 ¾" className="w-full" />
            </div>

            <p className="mt-4 inline-flex items-center gap-2 rounded-lg bg-dorado/15 border border-dorado/30
                          px-3 py-2 text-[11px] text-crema/75">
              <Icono nombre="telefono" size={14} className="text-dorado" />
              También podés escanearlo desde el local
            </p>
          </div>
        </div>

        {/* Contacto */}
        <div className="flex flex-col gap-2 mt-4 cascada">
          <a
            href={LOCAL.instagram}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-3 rounded-xl border border-borde bg-panel px-4 py-3
                       text-sm transition-all duration-300 hover:border-dorado/50"
          >
            <Icono nombre="instagram" size={19} className="text-dorado" />
            @barberia9.¾
            <Icono
              nombre="flecha"
              size={14}
              className="ml-auto text-crema/30 transition-transform duration-300 group-hover:translate-x-1"
            />
          </a>
          <a
            href="https://wa.me/"
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-3 rounded-xl border border-borde bg-panel px-4 py-3
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
        </div>

        {/* Firma de marca del pie de la referencia */}
        <p className="font-display italic text-center text-dorado/70 text-sm mt-7 leading-relaxed">
          Más que un corte,
          <br />
          es un estilo de vida
        </p>

        {usuario && (
          <button
            onClick={logout}
            className="group btn-outline w-full mt-6 inline-flex items-center justify-center gap-2"
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
    </div>
  );
}
