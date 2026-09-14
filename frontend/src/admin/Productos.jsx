import { useEffect, useState } from 'react';
import api from '../api/client';
import PanelPagina, { Aviso } from '../components/PanelPagina';
import Icono from '../components/Icono';
import { Esqueleto, Vacio } from '../components/Cargando';

const formInicial = { nombre: '', puntos_requeridos: '', stock: '' };

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [form, setForm] = useState(formInicial);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [editando, setEditando] = useState(null);
  const [borrador, setBorrador] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  const cargar = () =>
    api
      .get('/puntos/productos', { params: { todos: 1 } })
      .then(({ data }) => setProductos(data))
      .finally(() => setCargando(false));

  useEffect(() => {
    cargar();
  }, []);

  const crear = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.puntos_requeridos) return;
    setGuardando(true);
    setMensaje(null);
    try {
      await api.post('/puntos/productos', {
        nombre: form.nombre,
        puntos_requeridos: Number(form.puntos_requeridos),
        stock: Number(form.stock) || 0,
      });
      setForm(formInicial);
      await cargar();
      setMensaje({
        texto: 'Producto agregado. Les avisamos a los clientes que ya tienen puntos suficientes.',
        exito: true,
      });
    } catch (err) {
      setMensaje({ texto: err.response?.data?.error || 'No se pudo agregar', exito: false });
    } finally {
      setGuardando(false);
    }
  };

  const actualizarStock = async (p, delta) => {
    await api.put(`/puntos/productos/${p.id}`, { stock: Math.max(0, p.stock + delta) });
    await cargar();
  };

  const guardarEdicion = async () => {
    try {
      await api.put(`/puntos/productos/${borrador.id}`, {
        nombre: borrador.nombre,
        puntos_requeridos: Number(borrador.puntos_requeridos),
        stock: Number(borrador.stock),
        activo: borrador.activo,
      });
      setEditando(null);
      setBorrador(null);
      await cargar();
      setMensaje({ texto: 'Guardado.', exito: true });
    } catch (err) {
      setMensaje({ texto: err.response?.data?.error || 'No se pudo guardar', exito: false });
    }
  };

  const alternarActivo = async (p) => {
    await api.put(`/puntos/productos/${p.id}`, { activo: p.activo ? 0 : 1 });
    await cargar();
    setMensaje({
      texto: p.activo
        ? 'Desactivado. Sale del catálogo, pero lo podés volver a activar.'
        : 'Activado de nuevo.',
      exito: true,
    });
  };

  return (
    <PanelPagina
      icono="regalo"
      titulo="Productos canjeables"
      descripcion="Lo que tus clientes pueden llevarse con los puntos que suman en cada corte. Al agregar uno nuevo, les avisamos a los que ya tienen puntos de sobra."
    >
      <Aviso mensaje={mensaje} />

      <form onSubmit={crear} className="card grid sm:grid-cols-4 gap-2 mb-7 animate-aparecer">
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
        <button disabled={guardando} className="btn-dorado py-3 flex items-center justify-center gap-2">
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
          {productos.map((p) =>
            editando === p.id ? (
              <div key={p.id} className="card border-dorado/50 animate-aparecer">
                <p className="rotulo-tenue mb-3">Editando</p>
                <div className="grid sm:grid-cols-3 gap-2">
                  <input
                    className="input-dorado"
                    value={borrador.nombre}
                    onChange={(e) => setBorrador({ ...borrador, nombre: e.target.value })}
                  />
                  <input
                    className="input-dorado"
                    type="number"
                    value={borrador.puntos_requeridos}
                    onChange={(e) => setBorrador({ ...borrador, puntos_requeridos: e.target.value })}
                  />
                  <input
                    className="input-dorado"
                    type="number"
                    value={borrador.stock}
                    onChange={(e) => setBorrador({ ...borrador, stock: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={guardarEdicion} className="btn-dorado px-6 py-2.5 text-[13px]">
                    Guardar
                  </button>
                  <button
                    onClick={() => {
                      setEditando(null);
                      setBorrador(null);
                    }}
                    className="btn-outline px-6 py-2.5 text-[13px]"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div
                key={p.id}
                className={`card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3
                            transition-all duration-300 ${p.activo ? '' : 'opacity-55'}`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
                      p.activo && p.stock > 0
                        ? 'border-dorado/40 text-dorado'
                        : 'border-borde text-crema/30'
                    }`}
                  >
                    <Icono nombre="regalo" size={18} />
                  </span>
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      {p.nombre}
                      {!p.activo && (
                        <span className="rounded-full border border-borde px-2 py-0.5 text-[10px] uppercase tracking-wider text-crema/45">
                          inactivo
                        </span>
                      )}
                    </p>
                    <p className="text-crema/60 text-sm flex items-center gap-2 mt-0.5">
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
                    className="btn-outline px-3 py-2 flex items-center"
                  >
                    <Icono nombre="menos" size={15} grosor={2} />
                  </button>
                  <button
                    onClick={() => actualizarStock(p, 1)}
                    aria-label={`Sumar stock a ${p.nombre}`}
                    className="btn-outline px-3 py-2 flex items-center"
                  >
                    <Icono nombre="mas" size={15} grosor={2} />
                  </button>
                  <button
                    onClick={() => {
                      setEditando(p.id);
                      setBorrador({ ...p });
                      setMensaje(null);
                    }}
                    className="btn-outline px-4 py-2 text-[13px]"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => alternarActivo(p)}
                    className={`px-4 py-2 text-[13px] rounded-full border transition-all duration-200 active:scale-[0.97] ${
                      p.activo
                        ? 'border-red-400/40 text-red-400/85 hover:text-red-400 hover:border-red-400/70'
                        : 'border-dorado/50 text-dorado hover:bg-dorado/10'
                    }`}
                  >
                    {p.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </PanelPagina>
  );
}
