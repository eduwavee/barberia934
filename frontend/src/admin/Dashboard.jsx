import { useEffect, useState } from 'react';
import api from '../api/client';
import PanelPagina from '../components/PanelPagina';
import Icono from '../components/Icono';
import Contador from '../components/Contador';
import { Esqueleto, Vacio } from '../components/Cargando';
import GraficoIngresos from '../components/GraficoIngresos';

const formatoPesos = (n) => `$${n.toLocaleString('es-AR')}`;

function Tarjeta({ titulo, resumen, icono }) {
  if (!resumen) return null;
  return (
    <div className="card group">
      <div className="flex items-center justify-between mb-2">
        <p className="text-crema/60 text-sm">{titulo}</p>
        <Icono
          nombre={icono}
          size={18}
          className="text-dorado/60 transition-transform duration-300 group-hover:scale-110"
        />
      </div>
      <Contador
        valor={resumen.neto}
        formato={formatoPesos}
        className="text-2xl font-display text-dorado"
      />
      <p className="text-crema/40 text-xs mt-1">
        Ingresos {formatoPesos(resumen.ingresos)} · Gastos {formatoPesos(resumen.gastos)}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const [resumen, setResumen] = useState(null);
  const [turnosHoy, setTurnosHoy] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vigente = true;
    const hoy = new Date().toISOString().slice(0, 10);

    Promise.all([
      api.get('/ingresos/resumen'),
      api.get('/turnos', { params: { fecha: hoy } }),
    ])
      .then(([r, t]) => {
        if (!vigente) return;
        setResumen(r.data);
        setTurnosHoy(t.data);
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, []);

  return (
    <PanelPagina icono="panel" titulo="Panel del dueño" descripcion="Cómo viene el día, la semana y el mes.">

        <div className="grid sm:grid-cols-3 gap-3 mb-7 cascada">
          <Tarjeta
            titulo={`Hoy · ${resumen?.hoy?.turnos ?? 0} turnos`}
            resumen={resumen?.hoy}
            icono="reloj"
          />
          <Tarjeta titulo="Esta semana" resumen={resumen?.semana} icono="calendario" />
          <Tarjeta titulo="Este mes" resumen={resumen?.mes} icono="ingresos" />
        </div>

        <div className="mb-7">
          <GraficoIngresos />
        </div>

        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <Icono nombre="calendario" size={18} className="text-dorado" />
          Turnos de hoy
        </h2>

        {cargando ? (
          <Esqueleto lineas={2} />
        ) : turnosHoy.length === 0 ? (
          <Vacio icono="reloj">No hay turnos para hoy.</Vacio>
        ) : (
          <div className="flex flex-col gap-2 cascada">
            {turnosHoy.map((t) => (
              <div key={t.id} className="card flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-dorado/30 text-dorado">
                    <Icono nombre="tijera" size={18} />
                  </span>
                  <div>
                    <p className="font-medium">
                      {t.hora} · {t.cliente_nombre}
                    </p>
                    <p className="text-crema/60 text-sm">{t.servicio_nombre}</p>
                  </div>
                </div>
                <span className="text-xs uppercase tracking-wide text-dorado">{t.estado}</span>
              </div>
            ))}
          </div>
        )}
    </PanelPagina>
  );
}
