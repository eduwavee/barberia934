import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import BottomNav from '../components/BottomNav';
import Encabezado from '../components/Encabezado';
import Icono from '../components/Icono';
import { Esqueleto } from '../components/Cargando';

const estilosEstado = {
  pendiente: { texto: 'text-dorado', fondo: 'border-dorado/40 text-dorado', icono: 'reloj' },
  confirmado: { texto: 'text-dorado', fondo: 'border-dorado/40 text-dorado', icono: 'check' },
  completado: { texto: 'text-green-400', fondo: 'border-green-400/30 text-green-400', icono: 'estrella' },
  cancelado: { texto: 'text-red-400', fondo: 'border-red-400/30 text-red-400', icono: 'cerrar' },
};

export default function MisTurnos() {
  const [turnos, setTurnos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cancelando, setCancelando] = useState(null);

  const cargar = () =>
    api
      .get('/turnos/mios')
      .then(({ data }) => setTurnos(data))
      .finally(() => setCargando(false));

  useEffect(() => {
    cargar();
  }, []);

  const cancelar = async (id) => {
    setCancelando(id);
    try {
      await api.delete(`/turnos/${id}`);
      await cargar();
    } finally {
      setCancelando(null);
    }
  };

  return (
    <div className="max-w-md mx-auto pb-28">
      <Encabezado titulo="Mis turnos" volverA="/" />

      <div className="px-5 pt-5">
        {cargando ? (
          <Esqueleto lineas={3} />
        ) : turnos.length === 0 ? (
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
        ) : (
          <div className="flex flex-col gap-3 cascada">
            {turnos.map((t) => {
              const estilo = estilosEstado[t.estado] ?? estilosEstado.pendiente;
              const seCancela = cancelando === t.id;
              return (
                <div
                  key={t.id}
                  className={`card transition-opacity duration-300 ${seCancela ? 'opacity-40' : ''}`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${estilo.fondo}`}
                      >
                        <Icono nombre={estilo.icono} size={19} />
                      </span>
                      <div>
                        <p className="font-semibold">{t.servicio_nombre}</p>
                        <p className="text-crema/50 text-sm mt-0.5">
                          {t.fecha} · {t.hora}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${estilo.texto}`}>
                      {t.estado}
                    </span>
                  </div>

                  {['pendiente', 'confirmado'].includes(t.estado) && (
                    <button
                      onClick={() => cancelar(t.id)}
                      disabled={seCancela}
                      className="group text-red-400/75 hover:text-red-400 text-sm mt-3 flex items-center gap-1.5
                                 transition-colors duration-200 disabled:opacity-50"
                    >
                      <Icono
                        nombre="cerrar"
                        size={13}
                        className="transition-transform duration-300 group-hover:rotate-90"
                      />
                      {seCancela ? 'Cancelando…' : 'Cancelar turno'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
