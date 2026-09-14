import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import BottomNav from '../components/BottomNav';
import Icono from '../components/Icono';
import { Esqueleto } from '../components/Cargando';
import logo from '../assets/logo.jpeg';
import banner from '../assets/banner-maquina.jpg';

const accesos = [
  { to: '/turnos', label: 'Turnos', icono: 'calendario' },
  { to: '/puntos', label: 'Mis puntos', icono: 'estrella' },
  { to: '/pagos', label: 'Pagos', icono: 'tarjeta' },
  { to: '/ubicacion', label: 'Ubicación', icono: 'ubicacion' },
];

export default function Home() {
  const { usuario } = useAuth();
  const [proximoTurno, setProximoTurno] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vigente = true;
    api
      .get('/turnos/mios')
      .then(({ data }) => {
        if (!vigente) return;
        const pendiente = data.find((t) => ['pendiente', 'confirmado'].includes(t.estado));
        setProximoTurno(pendiente || null);
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, []);

  return (
    <div className="max-w-md mx-auto pb-28">
      {/* Barra superior: menú · sello · notificaciones */}
      <header className="flex items-center justify-between px-5 h-16">
        <Link
          to="/ubicacion"
          aria-label="Menú"
          className="p-2 -m-2 text-crema/80 hover:text-dorado transition-colors duration-200"
        >
          <Icono nombre="menu" size={22} />
        </Link>
        <img
          src={logo}
          alt="Barbería 9 ¾"
          className="w-14 h-14 rounded-full object-cover animate-sello"
        />
        <Link
          to="/turnos/mios"
          aria-label="Mis turnos"
          className="relative p-2 -m-2 text-crema/80 hover:text-dorado transition-colors duration-200"
        >
          <Icono nombre="campana" size={21} />
          {proximoTurno && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-dorado animate-latido" />
          )}
        </Link>
      </header>

      <div className="px-5 mt-2 animate-aparecer">
        <h1 className="font-display text-[26px] leading-tight">
          Hola, {usuario?.nombre?.split(' ')[0]}
        </h1>
        <p className="text-crema/50 text-sm mt-0.5">Bienvenido a Barbería 9 ¾</p>
      </div>

      {/* Banner promocional */}
      <div className="px-5 mt-4">
        <div className="relative h-28 rounded-xl overflow-hidden border border-borde animate-aparecer-escala">
          <img
            src={banner}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: '55% 46%' }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-negro via-negro/85 to-transparent" />
          <div className="relative h-full flex flex-col justify-center pl-6">
            <p className="font-display text-[19px] leading-snug tracking-wide">TU ESTILO</p>
            <p className="font-display text-[19px] leading-snug tracking-wide">NUESTRA PASIÓN</p>
          </div>
        </div>
      </div>

      {/* Accesos rápidos: teselas arena con icono oscuro */}
      <div className="grid grid-cols-4 gap-3 px-5 mt-5 cascada">
        {accesos.map((a) => (
          <Link key={a.to} to={a.to} className="group flex flex-col items-center gap-2 presionable">
            <span
              className="flex h-[52px] w-full items-center justify-center rounded-xl bg-dorado text-negro
                         transition-all duration-300 group-hover:bg-dorado-claro group-hover:-translate-y-0.5"
            >
              <Icono nombre={a.icono} size={23} grosor={1.6} />
            </span>
            <span className="text-[10px] text-center leading-tight text-crema/75">{a.label}</span>
          </Link>
        ))}
      </div>

      {/* Próximos turnos */}
      <div className="px-5 mt-7">
        <div className="flex justify-between items-center mb-3">
          <h2 className="rotulo">Próximos turnos</h2>
          <Link to="/turnos/mios" className="group text-crema/60 text-xs flex items-center gap-1 hover:text-dorado transition-colors duration-200">
            Ver todos
            <Icono
              nombre="flecha"
              size={12}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
        </div>

        {cargando ? (
          <Esqueleto lineas={1} />
        ) : proximoTurno ? (
          <div className="card-papel animate-aparecer">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-negro/10 text-negro">
                <Icono nombre="tijera" size={20} />
              </span>
              <div>
                <p className="font-semibold">{proximoTurno.servicio_nombre}</p>
                <p className="text-negro/60 text-sm">
                  {proximoTurno.fecha} · {proximoTurno.hora}
                </p>
              </div>
            </div>
            <Link
              to="/turnos/mios"
              className="mt-4 block w-full rounded-lg bg-dorado py-3 text-center text-sm font-semibold
                         tracking-wide text-negro transition-all duration-200 hover:bg-dorado-oscuro
                         hover:text-crema active:scale-[0.98]"
            >
              VER MI TURNO
            </Link>
          </div>
        ) : (
          <div className="card-papel text-center animate-aparecer">
            <p className="font-semibold">No tenés turnos próximos</p>
            <p className="text-negro/60 text-sm mt-1">¡Sacá tu turno y asegurá tu horario!</p>
            <Link
              to="/turnos"
              className="mt-4 block w-full rounded-lg bg-dorado py-3 text-sm font-semibold tracking-wide
                         text-negro transition-all duration-200 hover:bg-dorado-oscuro hover:text-crema
                         active:scale-[0.98]"
            >
              SACAR TURNO
            </Link>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
