import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import BottomNav from '../components/BottomNav';
import Pantalla from '../components/Pantalla';
import Icono from '../components/Icono';
import { Esqueleto } from '../components/Cargando';
import useRevelar from '../hooks/useRevelar';
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
  const refAccesos = useRevelar();
  const refTurnos = useRevelar();

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
    <Pantalla className="max-w-md mx-auto pb-28">
      {/* Barra superior: menú · sello · notificaciones */}
      <header className="flex items-center justify-between px-5 pt-3 pb-1">
        <Link
          to="/ubicacion"
          aria-label="Menú"
          className="p-2 -m-2 text-crema hover:text-dorado transition-colors duration-200 active:scale-90"
        >
          <Icono nombre="menu" size={24} grosor={1.9} />
        </Link>
        <img
          src={logo}
          alt="Barbería 9 ¾"
          className="w-[74px] h-[74px] rounded-full object-cover animate-sello"
        />
        <Link
          to="/turnos/mios"
          aria-label="Mis turnos"
          className="relative p-2 -m-2 text-crema hover:text-dorado transition-colors duration-200 active:scale-90"
        >
          <Icono nombre="campana" size={22} />
          {proximoTurno && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-dorado animate-latido" />
          )}
        </Link>
      </header>

      <div className="px-5 mt-4 animate-aparecer">
        <h1 className="text-[26px] font-bold leading-tight">
          Hola, {usuario?.nombre?.split(' ')[0]}
        </h1>
        <p className="text-crema/55 text-[15px] mt-1">Bienvenido a Barbería 9 ¾</p>
      </div>

      {/* Banner promocional */}
      <div className="px-5 mt-5">
        <div className="relative h-[116px] rounded-2xl overflow-hidden border border-dorado/20 animate-aparecer-escala">
          <img
            src={banner}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover animate-deriva"
            style={{ objectPosition: '55% 46%' }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-negro via-negro/80 to-transparent" />
          <div className="relative h-full flex flex-col justify-center pl-6">
            <p className="font-display text-[20px] leading-[1.35] tracking-[0.12em]">TU ESTILO</p>
            <p className="font-display text-[20px] leading-[1.35] tracking-[0.12em]">
              NUESTRA PASIÓN
            </p>
          </div>
        </div>
      </div>

      {/* Accesos rápidos: teselas arena con icono oscuro */}
      <div ref={refAccesos} className="revelable grid grid-cols-4 gap-3 px-5 mt-5">
        {accesos.map((a) => (
          <Link key={a.to} to={a.to} className="group flex flex-col items-center gap-2 presionable">
            <span
              className="flex aspect-square w-full items-center justify-center rounded-2xl bg-dorado
                         text-negro shadow-[0_6px_18px_-8px_rgba(201,174,140,0.7)] transition-all
                         duration-300 group-hover:bg-dorado-claro group-hover:-translate-y-1"
            >
              <Icono
                nombre={a.icono}
                size={26}
                grosor={1.7}
                className="transition-transform duration-300 group-hover:scale-110"
              />
            </span>
            <span className="text-[11px] text-center leading-tight text-crema/85">{a.label}</span>
          </Link>
        ))}
      </div>

      {/* Próximos turnos */}
      <div ref={refTurnos} className="revelable px-5 mt-7">
        <div className="flex justify-between items-center mb-3">
          <h2 className="rotulo">Próximos turnos</h2>
          <Link
            to="/turnos/mios"
            className="group text-crema/70 text-[13px] flex items-center gap-1 hover:text-dorado transition-colors duration-200"
          >
            Ver todos
            <Icono
              nombre="flecha"
              size={13}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
        </div>

        {cargando ? (
          <Esqueleto lineas={1} />
        ) : proximoTurno ? (
          <div className="card-papel animate-aparecer">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-negro/10 text-negro">
                <Icono nombre="tijera" size={21} />
              </span>
              <div>
                <p className="font-bold">{proximoTurno.servicio_nombre}</p>
                <p className="text-negro/60 text-sm mt-0.5">
                  {proximoTurno.fecha} · {proximoTurno.hora}
                </p>
              </div>
            </div>
            <Link to="/turnos/mios" className="btn-en-papel mt-5">
              VER MI TURNO
            </Link>
          </div>
        ) : (
          <div className="card-papel text-center animate-aparecer">
            <p className="font-bold text-[15px]">No tenés turnos próximos</p>
            <p className="text-negro/65 text-sm mt-1.5">¡Sacá tu turno y asegurá tu horario!</p>
            <Link to="/turnos" className="btn-en-papel mt-5">
              SACAR TURNO
            </Link>
          </div>
        )}
      </div>

      <BottomNav />
    </Pantalla>
  );
}
