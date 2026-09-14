import { useEffect, useState } from 'react';
import api from '../api/client';
import AdminNav from '../components/AdminNav';
import Icono from '../components/Icono';
import { Esqueleto, Vacio } from '../components/Cargando';

const formInicial = { nombre: '', puntos_requeridos: '', stock: '' };

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [form, setForm] = useState(formInicial);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const cargar = () =>
    api
      .get('/puntos/productos')
      .then(({ data }) => setProductos(data))
      .finally(() => setCargando(false));

  useEffect(() => {
    cargar();
  }, []);

  const crear = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.puntos_requeridos) return;
    setGuardando(true);
    try {
      await api.post('/puntos/productos', {
        nombre: form.nombre,
        puntos_requeridos: Number(form.puntos_requeridos),
        stock: Number(form.stock) || 0,
      });
      setForm(formInicial);
      await cargar();
    } finally {
      setGuardando(false);
    }
  };

  const actualizarStock = async (p, delta) => {
    await api.put(`/puntos/productos/${p.id}`, { stock: Math.max(0, p.stock + delta) });
    await cargar();
  };

  const desactivar = async (p) => {
    await api.put(`/puntos/productos/${p.id}`, { activo: 0 });
    await cargar();
  };

  return (
    <div className="max-w-3xl mx-auto pb-16">
      <AdminNav />
      <div className="px-5 pt-6">
        <h1 className="font-display text-[22px] mb-1 flex items-center gap-2 animate-aparecer">
          <Icono nombre="regalo" size={22} className="text-dorado" />
          Productos canjeables
        </h1>
        <div className="filete mb-4" />

        <p className="text-crema/60 text-sm mb-4">
          Lo que tus clientes pueden canjear con los puntos que suman en cada corte.
        </p>

        <form onSubmit={crear} className="card grid sm:grid-cols-4 gap-2 mb-6 animate-aparecer">
          <input
            className="input-dorado"
            placeholder="Nombre del producto"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          />
          <input
            className="input-dorado"
            type="number"
            placeholder="Puntos requeridos"
            value={form.puntos_requeridos}
            onChange={(e) => setForm({ ...form, puntos_requeridos: e.target.value })}
          />
          <input
            className="input-dorado"
            type="number"
            placeholder="Stock inicial"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
          />
          <button disabled={guardando} className="btn-dorado flex items-center justify-center gap-2">
            <Icono nombre="mas" size={16} grosor={2} />
            {guardando ? 'Agregando…' : 'Agregar'}
          </button>
        </form>

        {cargando ? (
          <Esqueleto lineas={3} />
        ) : productos.length === 0 ? (
          <Vacio icono="regalo">Todavía no cargaste productos canjeables.</Vacio>
        ) : (
          <div className="flex flex-col gap-2 cascada">
            {productos.map((p) => (
              <div
                key={p.id}
                className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
                      p.stock > 0 ? 'border-dorado/40 text-dorado' : 'border-borde text-crema/30'
                    }`}
                  >
                    <Icono nombre="regalo" size={18} />
                  </span>
                  <div>
                    <p className="font-medium">{p.nombre}</p>
                    <p className="text-crema/60 text-sm flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-dorado/80">
                        <Icono nombre="estrella" size={12} relleno />
                        {p.puntos_requeridos} pts
                      </span>
                      <span className="text-crema/30">·</span>
                      <span className={p.stock > 0 ? '' : 'text-red-400/80'}>stock: {p.stock}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => actualizarStock(p, -1)}
                    aria-label={`Restar stock a ${p.nombre}`}
                    className="btn-outline px-3 py-1.5 flex items-center"
                  >
                    <Icono nombre="menos" size={15} grosor={2} />
                  </button>
                  <button
                    onClick={() => actualizarStock(p, 1)}
                    aria-label={`Sumar stock a ${p.nombre}`}
                    className="btn-outline px-3 py-1.5 flex items-center"
                  >
                    <Icono nombre="mas" size={15} grosor={2} />
                  </button>
                  <button
                    onClick={() => desactivar(p)}
                    className="text-red-400/80 hover:text-red-400 text-sm ml-2 flex items-center gap-1.5
                               transition-colors duration-200"
                  >
                    <Icono nombre="cerrar" size={13} />
                    Desactivar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
