import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import PanelPagina from '../components/PanelPagina';
import Icono from '../components/Icono';
import Contador from '../components/Contador';
import { Esqueleto, Vacio } from '../components/Cargando';

const formatoPesos = (n) => `$${Number(n || 0).toLocaleString('es-AR')}`;

/** Iniciales para el avatar circular, al estilo del sello. */
const iniciales = (nombre = '') =>
  nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

/** "2026-09-14" → "hace 3 días" / "hoy" */
function desde(fecha) {
  if (!fecha) return 'nunca vino';
  const dias = Math.floor((Date.now() - new Date(`${fecha}T12:00:00`).getTime()) / 86_400_000);
  if (dias <= 0) return 'hoy';
  if (dias === 1) return 'ayer';
  if (dias < 30) return `hace ${dias} días`;
  const meses = Math.floor(dias / 30);
  return `hace ${meses} ${meses === 1 ? 'mes' : 'meses'}`;
}

const estadoColor = {
  completado: 'text-green-400',
  confirmado: 'text-dorado',
  pendiente: 'text-dorado/70',
  cancelado: 'text-red-400',
};

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [ficha, setFicha] = useState(null);
  const [cargandoFicha, setCargandoFicha] = useState(false);

  useEffect(() => {
    let vigente = true;
    api
      .get('/usuarios')
      .then(({ data }) => vigente && setClientes(data))
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, []);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return clientes;
    return clientes.filter((c) =>
      [c.nombre, c.email, c.telefono].filter(Boolean).some((v) => v.toLowerCase().includes(q)),
    );
  }, [clientes, busqueda]);

  const abrirFicha = async (id) => {
    setCargandoFicha(true);
    setFicha(null);
    try {
      const { data } = await api.get(`/usuarios/${id}`);
      setFicha(data);
    } finally {
      setCargandoFicha(false);
    }
  };

  // --- Ficha de un cliente -------------------------------------------------
  if (ficha || cargandoFicha) {
    return (
      <PanelPagina
        icono="clientes"
        titulo={ficha?.cliente.nombre ?? 'Cargando…'}
        descripcion={
          ficha
            ? `${ficha.cliente.email}${ficha.cliente.telefono ? ` · ${ficha.cliente.telefono}` : ' · sin teléfono'}`
            : null
        }
        acciones={
          <button
            onClick={() => setFicha(null)}
            className="group btn-outline px-4 py-2 text-[13px] flex items-center gap-2 shrink-0"
          >
            <Icono
              nombre="atras"
              size={14}
              className="transition-transform duration-300 group-hover:-translate-x-1"
            />
            Volver
          </button>
        }
      >
        {cargandoFicha || !ficha ? (
          <Esqueleto lineas={3} />
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 cascada">
              {[
                { rotulo: 'Cortes', valor: ficha.resumen.cortes, icono: 'tijera' },
                { rotulo: 'Gastado', valor: ficha.resumen.gastado, icono: 'ingresos', formato: formatoPesos },
                { rotulo: 'Puntos', valor: ficha.cliente.puntos, icono: 'estrella' },
                { rotulo: 'Cancelados', valor: ficha.resumen.cancelados, icono: 'cerrar' },
              ].map((t) => (
                <div key={t.rotulo} className="card group">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-crema/55 text-[12px]">{t.rotulo}</p>
                    <Icono
                      nombre={t.icono}
                      size={15}
                      className="text-dorado/55 transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                  <Contador
                    valor={t.valor}
                    formato={t.formato}
                    className="text-[22px] font-display text-dorado"
                  />
                </div>
              ))}
            </div>

            <p className="text-crema/50 text-[13px] mb-6">
              Última visita: <span className="text-crema">{desde(ficha.resumen.ultima_visita)}</span>
              {' · '}Cliente desde {ficha.cliente.fecha_registro?.slice(0, 10)}
            </p>

            <h2 className="rotulo mb-3">Turnos</h2>
            {ficha.turnos.length === 0 ? (
              <Vacio icono="calendario">Todavía no sacó ningún turno.</Vacio>
            ) : (
              <div className="flex flex-col gap-2 mb-7 cascada">
                {ficha.turnos.map((t) => (
                  <div key={t.id} className="card flex justify-between items-center py-3">
                    <div>
                      <p className="font-medium text-[14px]">
                        {t.fecha} · {t.hora}
                      </p>
                      <p className="text-crema/55 text-[13px] mt-0.5">
                        {t.servicio_nombre} · {formatoPesos(t.precio)}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${
                        estadoColor[t.estado] ?? ''
                      }`}
                    >
                      {t.estado}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <h2 className="rotulo mb-3">Canjes</h2>
            {ficha.canjes.length === 0 ? (
              <Vacio icono="regalo">Todavía no canjeó nada.</Vacio>
            ) : (
              <div className="flex flex-col gap-2 cascada">
                {ficha.canjes.map((c, i) => (
                  <div key={`${c.fecha}-${i}`} className="card flex justify-between items-center py-3">
                    <p className="font-medium text-[14px] flex items-center gap-2">
                      <Icono nombre="regalo" size={15} className="text-dorado/70" />
                      {c.producto}
                    </p>
                    <span className="text-crema/55 text-[13px]">
                      −{c.puntos_usados} pts · {c.fecha?.slice(0, 10)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </PanelPagina>
    );
  }

  // --- Listado -------------------------------------------------------------
  return (
    <PanelPagina
      icono="clientes"
      titulo="Clientes"
      descripcion="Tocá un cliente para ver su historial: cuántos cortes lleva, cuánto gastó y qué canjeó."
    >
      <input
        placeholder="Buscar por nombre, email o teléfono"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="input-dorado mb-5 sm:max-w-md"
      />

      {cargando ? (
        <Esqueleto lineas={3} />
      ) : filtrados.length === 0 ? (
        <Vacio icono="clientes">
          {busqueda
            ? 'Ningún cliente coincide con esa búsqueda.'
            : 'Todavía no hay clientes registrados.'}
        </Vacio>
      ) : (
        <div className="flex flex-col gap-2 cascada">
          {filtrados.map((c) => (
            <button
              key={c.id}
              onClick={() => abrirFicha(c.id)}
              className="card group flex justify-between items-center text-left hover:border-dorado/50
                         hover:-translate-y-0.5 active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full
                             border border-dorado/40 text-dorado text-sm font-display"
                >
                  {iniciales(c.nombre) || <Icono nombre="clientes" size={17} />}
                </span>
                <div>
                  <p className="font-medium">{c.nombre}</p>
                  <p className="text-crema/55 text-sm mt-0.5">
                    {c.cortes} {c.cortes === 1 ? 'corte' : 'cortes'} · {desde(c.ultima_visita)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-dorado font-semibold whitespace-nowrap">
                  <Icono nombre="estrella" size={13} relleno />
                  {c.puntos} pts
                </span>
                <Icono
                  nombre="flecha"
                  size={15}
                  className="text-crema/25 transition-transform duration-300 group-hover:translate-x-1"
                />
              </div>
            </button>
          ))}
        </div>
      )}
    </PanelPagina>
  );
}
