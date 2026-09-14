import { useCallback, useEffect, useState } from 'react';
import api from '../api/client';
import AdminNav from '../components/AdminNav';
import Icono from '../components/Icono';
import { Esqueleto, Vacio } from '../components/Cargando';

const estados = ['pendiente', 'confirmado', 'completado', 'cancelado'];

const colorEstado = {
  pendiente: 'border-dorado/40 text-dorado',
  confirmado: 'border-dorado/40 text-dorado',
  completado: 'border-green-400/40 text-green-400',
  cancelado: 'border-red-400/40 text-red-400',
};

export default function TurnosAdmin() {
  const [turnos, setTurnos] = useState([]);
  const [filtroFecha, setFiltroFecha] = useState('');
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(null);

  const cargar = useCallback(
    () =>
      api
        .get('/turnos', { params: filtroFecha ? { fecha: filtroFecha } : {} })
        .then(({ data }) => setTurnos(data)),
    [filtroFecha],
  );

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    cargar().finally(() => {
      if (vigente) setCargando(false);
    });
    return () => {
      vigente = false;
    };
  }, [cargar]);

  const cambiarEstado = async (id, estado) => {
    setActualizando(id);
    try {
      await api.put(`/turnos/${id}/estado`, { estado });
      await cargar();
    } finally {
      setActualizando(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-16">
      <AdminNav />
      <div className="px-5 pt-6">
        <h1 className="font-display text-[22px] mb-1 flex items-center gap-2 animate-aparecer">
          <Icono nombre="calendario" size={22} className="text-dorado" />
          Turnos
        </h1>
        <div className="filete mb-5" />

        <div className="flex items-center gap-2 mb-5">
          <input
            type="date"
            className="input-dorado sm:w-60"
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
          />
          {filtroFecha && (
            <button
              onClick={() => setFiltroFecha('')}
              className="group text-crema/50 hover:text-dorado text-sm flex items-center gap-1
                         transition-colors duration-200 animate-entrar-derecha"
            >
              <Icono
                nombre="cerrar"
                size={14}
                className="transition-transform duration-300 group-hover:rotate-90"
              />
              Ver todos
            </button>
          )}
        </div>

        {cargando ? (
          <Esqueleto lineas={3} />
        ) : turnos.length === 0 ? (
          <Vacio icono="calendario">No hay turnos para mostrar.</Vacio>
        ) : (
          <div className="flex flex-col gap-2 cascada">
            {turnos.map((t) => (
              <div
                key={t.id}
                className={`card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3
                            transition-opacity duration-300 ${actualizando === t.id ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
                      colorEstado[t.estado] ?? colorEstado.pendiente
                    }`}
                  >
                    <Icono nombre="tijera" size={18} />
                  </span>
                  <div>
                    <p className="font-medium">
                      {t.fecha} · {t.hora} — {t.cliente_nombre}
                    </p>
                    <p className="text-crema/60 text-sm">
                      {t.servicio_nombre} · ${t.precio} · {t.cliente_telefono}
                    </p>
                  </div>
                </div>
                <select
                  className="input-dorado sm:w-44"
                  value={t.estado}
                  disabled={actualizando === t.id}
                  onChange={(e) => cambiarEstado(t.id, e.target.value)}
                >
                  {estados.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
