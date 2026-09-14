import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import Icono from './Icono';

/**
 * Ingresos por día.
 *
 * Una sola serie a propósito: las tarjetas de arriba ya muestran ingresos,
 * gastos y neto, y los gastos de una barbería son esporádicos — una segunda
 * serie en cero casi todos los días es ruido. Los gastos igual aparecen en el
 * globo al pasar por encima, que es donde hacen falta.
 *
 * Las barras van en HTML y no en SVG: un SVG estirado al ancho del contenedor
 * deforma el texto y los bordes redondeados.
 */

const RANGOS = [7, 14, 30];
const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

const pesos = (n) => `$${Number(n || 0).toLocaleString('es-AR')}`;

/** El endpoint sólo devuelve los días con movimientos: acá se rellenan los huecos. */
function completarDias(filas, dias) {
  const porFecha = new Map(filas.map((f) => [f.fecha, f]));
  const salida = [];
  for (let i = dias - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const fila = porFecha.get(iso);
    salida.push({
      fecha: iso,
      dia: DIAS[d.getDay()],
      numero: d.getDate(),
      ingresos: fila?.ingresos ?? 0,
      gastos: fila?.gastos ?? 0,
    });
  }
  return salida;
}

/** Tope del eje redondeado hacia arriba, para que la escala no quede rara. */
function techo(maximo) {
  if (maximo <= 0) return 1000;
  const magnitud = 10 ** Math.floor(Math.log10(maximo));
  return Math.ceil(maximo / magnitud) * magnitud;
}

export default function GraficoIngresos() {
  const [dias, setDias] = useState(14);
  const [filas, setFilas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [activo, setActivo] = useState(null);
  const [verTabla, setVerTabla] = useState(false);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setActivo(null);
    api
      .get('/ingresos/serie', { params: { dias } })
      .then(({ data }) => vigente && setFilas(completarDias(data, dias)))
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, [dias]);

  const { maximo, total, mejor } = useMemo(() => {
    const max = Math.max(0, ...filas.map((f) => f.ingresos));
    return {
      maximo: techo(max),
      total: filas.reduce((a, f) => a + f.ingresos, 0),
      mejor: max > 0 ? filas.findIndex((f) => f.ingresos === max) : -1,
    };
  }, [filas]);

  // Con 30 días no entran todas las fechas en el eje: se muestran salteadas
  const saltoEje = Math.max(1, Math.ceil(filas.length / 7));

  return (
    <div className="card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="rotulo">Ingresos por día</h2>
          <p className="text-crema/45 text-[12px] mt-1">
            {pesos(total)} en los últimos {dias} días
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {RANGOS.map((r) => (
            <button
              key={r}
              onClick={() => setDias(r)}
              aria-pressed={dias === r}
              className={`chip px-3 py-1.5 text-[12px] ${
                dias === r ? 'chip-activo font-semibold' : 'text-crema/60'
              }`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      {cargando ? (
        <div className="esqueleto h-[170px] w-full mt-5" />
      ) : total === 0 ? (
        <div className="h-[170px] flex flex-col items-center justify-center gap-2 text-crema/45">
          <Icono nombre="ingresos" size={30} className="text-dorado/40 animate-flotar" />
          <p className="text-[13px]">Todavía no hay ingresos en este período.</p>
        </div>
      ) : (
        <>
          <div className="relative mt-7 h-[150px]">
            {/* Grilla, apenas marcada para no competir con las barras */}
            {[0, 0.5, 1].map((p) => (
              <span
                key={p}
                className="absolute left-0 right-0 border-t"
                style={{
                  bottom: `${p * 100}%`,
                  borderColor: `rgba(201,174,140,${p === 0 ? 0.28 : 0.1})`,
                }}
              />
            ))}

            <div className="absolute inset-0 flex items-end gap-[2px]">
              {filas.map((f, i) => (
                <button
                  key={f.fecha}
                  onMouseEnter={() => setActivo(i)}
                  onMouseLeave={() => setActivo(null)}
                  onFocus={() => setActivo(i)}
                  onBlur={() => setActivo(null)}
                  aria-label={`${f.fecha}: ${pesos(f.ingresos)}`}
                  className="group relative flex-1 h-full flex items-end"
                >
                  <span
                    className="w-full rounded-t transition-all duration-300"
                    style={{
                      height: `${(f.ingresos / maximo) * 100}%`,
                      minHeight: f.ingresos > 0 ? 3 : 0,
                      background: '#C9AE8C',
                      opacity: activo === null || activo === i ? 1 : 0.5,
                    }}
                  />
                  {/* Etiqueta directa sólo en el mejor día, no en todas las barras */}
                  {i === mejor && activo === null && (
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-semibold text-crema">
                      {pesos(f.ingresos)}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Globo de detalle */}
            {activo !== null && (
              <div
                className="pointer-events-none absolute -top-8 z-10 whitespace-nowrap rounded-lg
                           border border-dorado/35 bg-negro/95 px-3 py-2 text-[12px] shadow-tarjeta
                           animate-aparecer-escala"
                style={{
                  left: `${((activo + 0.5) / filas.length) * 100}%`,
                  transform: 'translateX(-50%)',
                }}
              >
                <span className="text-crema/60">
                  {filas[activo].dia} {filas[activo].numero}
                </span>
                <span className="font-semibold text-dorado ml-2">
                  {pesos(filas[activo].ingresos)}
                </span>
                {filas[activo].gastos > 0 && (
                  <span className="text-crema/50 ml-2">−{pesos(filas[activo].gastos)} gastos</span>
                )}
              </div>
            )}
          </div>

          {/* Eje de fechas */}
          <div className="flex gap-[2px] mt-2">
            {filas.map((f, i) => (
              <span key={f.fecha} className="flex-1 text-[10px] text-crema/35 text-center">
                {i % saltoEje === 0 ? f.numero : ''}
              </span>
            ))}
          </div>

          <button
            onClick={() => setVerTabla((v) => !v)}
            className="text-crema/45 hover:text-dorado text-[12px] mt-4 transition-colors duration-200"
          >
            {verTabla ? 'Ocultar tabla' : 'Ver los números'}
          </button>

          {verTabla && (
            <div className="mt-3 max-h-56 overflow-y-auto animate-aparecer">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-crema/45 text-left">
                    <th className="font-normal py-1.5">Día</th>
                    <th className="font-normal py-1.5 text-right">Ingresos</th>
                    <th className="font-normal py-1.5 text-right">Gastos</th>
                  </tr>
                </thead>
                <tbody>
                  {filas
                    .filter((f) => f.ingresos || f.gastos)
                    .slice()
                    .reverse()
                    .map((f) => (
                      <tr key={f.fecha} className="border-t border-borde">
                        <td className="py-1.5 text-crema/70">{f.fecha}</td>
                        <td className="py-1.5 text-right text-dorado">{pesos(f.ingresos)}</td>
                        <td className="py-1.5 text-right text-crema/55">
                          {f.gastos ? `−${pesos(f.gastos)}` : '—'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
