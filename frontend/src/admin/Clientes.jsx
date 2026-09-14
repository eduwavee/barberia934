import { useEffect, useState } from 'react';
import api from '../api/client';
import AdminNav from '../components/AdminNav';
import Icono from '../components/Icono';
import Contador from '../components/Contador';
import { Esqueleto, Vacio } from '../components/Cargando';

/** Iniciales para el avatar circular, al estilo del sello. */
const iniciales = (nombre = '') =>
  nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vigente = true;
    api
      .get('/usuarios')
      .then(({ data }) => {
        if (vigente) setClientes(data);
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, []);

  return (
    <div className="max-w-3xl mx-auto pb-16">
      <AdminNav />
      <div className="px-5 pt-6">
        <h1 className="font-display text-[22px] mb-1 flex items-center gap-2 animate-aparecer">
          <Icono nombre="clientes" size={22} className="text-dorado" />
          Clientes
        </h1>
        <div className="filete mb-5" />

        {cargando ? (
          <Esqueleto lineas={3} />
        ) : clientes.length === 0 ? (
          <Vacio icono="clientes">Todavía no hay clientes registrados.</Vacio>
        ) : (
          <div className="flex flex-col gap-2 cascada">
            {clientes.map((c) => (
              <div key={c.id} className="card flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full
                               border border-dorado/40 text-dorado text-sm font-display"
                  >
                    {iniciales(c.nombre) || <Icono nombre="clientes" size={17} />}
                  </span>
                  <div>
                    <p className="font-medium">{c.nombre}</p>
                    <p className="text-crema/60 text-sm">
                      {c.email} · {c.telefono || 'sin teléfono'}
                    </p>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 text-dorado font-semibold whitespace-nowrap">
                  <Icono nombre="estrella" size={13} relleno />
                  <Contador valor={c.puntos} /> pts
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
