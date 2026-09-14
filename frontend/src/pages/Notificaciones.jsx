import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import Encabezado from '../components/Encabezado';
import Pantalla from '../components/Pantalla';
import Icono from '../components/Icono';
import { Esqueleto, Vacio } from '../components/Cargando';
import { useNotificaciones } from '../context/NotificacionesContext';
import { activarNotificaciones, permisoActual, soportaPush } from '../lib/push';

/** Icono y color según el tipo de aviso. */
const estilos = {
  turno_reservado: { icono: 'calendario', color: 'border-dorado/40 text-dorado' },
  turno_confirmado: { icono: 'check', color: 'border-green-400/30 text-green-400' },
  turno_cancelado: { icono: 'cerrar', color: 'border-red-400/30 text-red-400' },
  turno_liberado: { icono: 'reloj', color: 'border-dorado/40 text-dorado' },
  turnos_liberados: { icono: 'calendario', color: 'border-dorado/40 text-dorado' },
  puntos_sumados: { icono: 'estrella', color: 'border-dorado/40 text-dorado' },
  puntos_disponibles: { icono: 'regalo', color: 'border-dorado/40 text-dorado' },
  producto_nuevo: { icono: 'regalo', color: 'border-dorado/40 text-dorado' },
};
const porDefecto = { icono: 'campana', color: 'border-dorado/30 text-dorado' };

/** "2026-09-14 18:30:00" → "hace 5 min" / "ayer" / "14/09" */
function hace(fechaSql) {
  const fecha = new Date(`${fechaSql.replace(' ', 'T')}Z`);
  const minutos = Math.floor((Date.now() - fecha.getTime()) / 60000);
  if (Number.isNaN(minutos)) return '';
  if (minutos < 1) return 'recién';
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias === 1) return 'ayer';
  if (dias < 7) return `hace ${dias} días`;
  return fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
}

export default function Notificaciones() {
  const navigate = useNavigate();
  const { notificaciones, sinLeer, cargando, marcarLeida, marcarTodasLeidas, eliminar } =
    useNotificaciones();
  const [permiso, setPermiso] = useState(() => permisoActual());
  const [activando, setActivando] = useState(false);

  useEffect(() => {
    setPermiso(permisoActual());
  }, []);

  const activar = async () => {
    setActivando(true);
    const resultado = await activarNotificaciones();
    setPermiso(resultado === 'activado' ? 'granted' : permisoActual());
    setActivando(false);
  };

  const abrir = (n) => {
    if (!n.leida) marcarLeida(n.id);
    if (n.enlace) navigate(n.enlace);
  };

  return (
    <Pantalla className="max-w-md mx-auto pb-28">
      <Encabezado titulo="Notificaciones" volverA="/" />

      <div className="px-5 pt-5">
        {/* Invitación a activar los avisos del sistema */}
        {soportaPush() && permiso !== 'granted' && (
          <div className="card mb-4 animate-aparecer">
            <div className="flex items-start gap-3">
              <Icono nombre="campana" size={20} className="text-dorado mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-[15px]">Enterate al toque</p>
                <p className="text-crema/55 text-[13px] mt-1 leading-relaxed">
                  {permiso === 'denied'
                    ? 'Bloqueaste las notificaciones para este sitio. Podés volver a permitirlas desde la configuración del navegador.'
                    : 'Activá los avisos y te llegan al celular cuando confirmamos tu turno, cuando sumás puntos o cuando se libera un horario.'}
                </p>
                {permiso !== 'denied' && (
                  <button
                    onClick={activar}
                    disabled={activando}
                    className="btn-dorado mt-3 w-full text-[13px] py-3"
                  >
                    {activando ? 'Activando…' : 'ACTIVAR NOTIFICACIONES'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {notificaciones.length > 0 && sinLeer > 0 && (
          <button
            onClick={marcarTodasLeidas}
            className="text-dorado text-[13px] mb-3 flex items-center gap-1.5 hover:text-dorado-claro transition-colors duration-200"
          >
            <Icono nombre="check" size={14} grosor={2} />
            Marcar todas como leídas
          </button>
        )}

        {cargando ? (
          <Esqueleto lineas={3} />
        ) : notificaciones.length === 0 ? (
          <Vacio icono="campana">
            Todavía no tenés avisos. Acá te vamos a contar cuando confirmemos un turno, cuando
            sumes puntos y cuando se libere un horario.
          </Vacio>
        ) : (
          <div className="flex flex-col gap-2.5 cascada">
            {notificaciones.map((n) => {
              const estilo = estilos[n.tipo] ?? porDefecto;
              return (
                <div
                  key={n.id}
                  className={`card flex items-start gap-3 transition-all duration-300 ${
                    n.leida ? 'opacity-60' : 'border-dorado/45'
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${estilo.color}`}
                  >
                    <Icono nombre={estilo.icono} size={18} />
                  </span>

                  <button onClick={() => abrir(n)} className="flex-1 text-left">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-[14px] leading-snug ${n.leida ? '' : 'font-semibold'}`}>
                        {n.titulo}
                      </p>
                      {!n.leida && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-dorado animate-latido" />
                      )}
                    </div>
                    {n.cuerpo && (
                      <p className="text-crema/55 text-[13px] mt-1 leading-relaxed">{n.cuerpo}</p>
                    )}
                    <p className="text-crema/35 text-[11px] mt-1.5">{hace(n.fecha)}</p>
                  </button>

                  <button
                    onClick={() => eliminar(n.id)}
                    aria-label="Eliminar aviso"
                    className="text-crema/30 hover:text-red-400 transition-all duration-300 hover:rotate-90 shrink-0"
                  >
                    <Icono nombre="cerrar" size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </Pantalla>
  );
}
