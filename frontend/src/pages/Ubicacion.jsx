import { useAuth } from '../context/AuthContext';
import BottomNav from '../components/BottomNav';
import Encabezado from '../components/Encabezado';
import Pantalla from '../components/Pantalla';
import Icono from '../components/Icono';
import useRevelar from '../hooks/useRevelar';
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
  const refQR = useRevelar();
  const refContacto = useRevelar();

  return (
    <Pantalla className="max-w-md mx-auto pb-28">
      <Encabezado titulo="Ubicación" volverA="/" />

      <div className="px-5 pt-5">
        {/* Mapa, dirección y acceso a Maps van juntos en una sola tarjeta */}
        <div className="card p-3 animate-aparecer-escala">
          <div className="relative h-44 rounded-xl overflow-hidden">
            <img
              src={mapa}
              alt="Mapa del local"
              className="h-full w-full object-cover animate-deriva"
            />
            <span className="absolute left-1/2 top-[60%] -translate-x-1/2 text-[12px] text-crema drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
              Barbería 9 ¾
            </span>
          </div>

          <a
            href={LOCAL.maps}
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

          <a href={LOCAL.maps} target="_blank" rel="noreferrer" className="btn-dorado block w-full">
            ABRIR EN GOOGLE MAPS
          </a>
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
            <img src={qr} alt="Código QR de Barbería 9 ¾" className="w-full" />
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
            href={LOCAL.instagram}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-3 rounded-2xl border border-dorado/20 bg-panel px-4 py-3.5
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
