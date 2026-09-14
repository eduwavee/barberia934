import { useEffect, useState } from 'react';
import api from '../api/client';
import AdminNav from '../components/AdminNav';
import Icono from '../components/Icono';
import Contador from '../components/Contador';
import { Esqueleto, Vacio } from '../components/Cargando';

const formatoPesos = (n) => `$${n.toLocaleString('es-AR')}`;

const periodos = [
  { clave: 'hoy', titulo: 'Neto hoy', icono: 'reloj' },
  { clave: 'semana', titulo: 'Neto semana', icono: 'calendario' },
  { clave: 'mes', titulo: 'Neto mes', icono: 'ingresos' },
];

export default function Ingresos() {
  const [movimientos, setMovimientos] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [form, setForm] = useState({ tipo: 'gasto', concepto: '', monto: '' });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const cargar = () =>
    Promise.all([api.get('/ingresos'), api.get('/ingresos/resumen')])
      .then(([m, r]) => {
        setMovimientos(m.data);
        setResumen(r.data);
      })
      .finally(() => setCargando(false));

  useEffect(() => {
    cargar();
  }, []);

  const agregar = async (e) => {
    e.preventDefault();
    if (!form.concepto || !form.monto) return;
    setGuardando(true);
    try {
      await api.post('/ingresos', { ...form, monto: Number(form.monto) });
      setForm({ tipo: 'gasto', concepto: '', monto: '' });
      await cargar();
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (id) => {
    await api.delete(`/ingresos/${id}`);
    await cargar();
  };

  return (
    <div className="max-w-3xl mx-auto pb-16">
      <AdminNav />
      <div className="px-5 pt-6">
        <h1 className="font-display text-[22px] mb-1 flex items-center gap-2 animate-aparecer">
          <Icono nombre="ingresos" size={22} className="text-dorado" />
          Control de ingresos
        </h1>
        <div className="filete mb-5" />

        {resumen && (
          <div className="grid sm:grid-cols-3 gap-3 mb-6 cascada">
            {periodos.map((p) => (
              <div key={p.clave} className="card group">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-crema/60 text-sm">{p.titulo}</p>
                  <Icono
                    nombre={p.icono}
                    size={18}
                    className="text-dorado/60 transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                <Contador
                  valor={resumen[p.clave].neto}
                  formato={formatoPesos}
                  className="text-2xl font-display text-dorado"
                />
              </div>
            ))}
          </div>
        )}

        <form onSubmit={agregar} className="card flex flex-col sm:flex-row gap-2 mb-6 animate-aparecer">
          <select
            className="input-dorado sm:w-40"
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
          >
            <option value="gasto">Gasto</option>
            <option value="ingreso">Ingreso extra</option>
          </select>
          <input
            className="input-dorado flex-1"
            placeholder="Concepto (ej: insumos, alquiler, venta suelta)"
            value={form.concepto}
            onChange={(e) => setForm({ ...form, concepto: e.target.value })}
          />
          <input
            type="number"
            className="input-dorado sm:w-32"
            placeholder="Monto"
            value={form.monto}
            onChange={(e) => setForm({ ...form, monto: e.target.value })}
          />
          <button disabled={guardando} className="btn-dorado sm:w-36 flex items-center justify-center gap-2">
            <Icono nombre="mas" size={16} grosor={2} />
            {guardando ? 'Cargando…' : 'Cargar'}
          </button>
        </form>

        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <Icono nombre="reloj" size={18} className="text-dorado" />
          Movimientos recientes
        </h2>

        {cargando ? (
          <Esqueleto lineas={3} />
        ) : movimientos.length === 0 ? (
          <Vacio icono="ingresos">Todavía no hay movimientos cargados.</Vacio>
        ) : (
          <div className="flex flex-col gap-2 cascada">
            {movimientos.map((m) => {
              const esIngreso = m.tipo === 'ingreso';
              return (
                <div key={m.id} className="card flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${
                        esIngreso
                          ? 'border-green-400/30 text-green-400'
                          : 'border-red-400/30 text-red-400'
                      }`}
                    >
                      <Icono nombre={esIngreso ? 'mas' : 'menos'} size={15} grosor={2} />
                    </span>
                    <div>
                      <p className="font-medium">{m.concepto}</p>
                      <p className="text-crema/50 text-xs">
                        {m.fecha} · {m.origen === 'turno' ? 'Turno completado' : 'Carga manual'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={esIngreso ? 'text-green-400' : 'text-red-400'}>
                      {esIngreso ? '+' : '-'}
                      {formatoPesos(m.monto)}
                    </span>
                    {m.origen === 'manual' && (
                      <button
                        onClick={() => eliminar(m.id)}
                        aria-label={`Eliminar ${m.concepto}`}
                        className="text-crema/40 hover:text-red-400 transition-all duration-300 hover:rotate-90"
                      >
                        <Icono nombre="cerrar" size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
