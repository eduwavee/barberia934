import { useEffect, useState } from 'react';
import api from '../api/client';
import PanelPagina, { Aviso } from '../components/PanelPagina';
import Icono from '../components/Icono';
import { Esqueleto, Vacio } from '../components/Cargando';

const formInicial = { nombre: '', precio: '', duracion_min: 30, puntos_otorgados: 100 };

export default function Servicios() {
  const [servicios, setServicios] = useState([]);
  const [form, setForm] = useState(formInicial);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [editando, setEditando] = useState(null); // id del servicio en edición
  const [borrador, setBorrador] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  // ?todos=1 trae también los dados de baja, para poder reactivarlos
  const cargar = () =>
    api
      .get('/servicios', { params: { todos: 1 } })
      .then(({ data }) => setServicios(data))
      .finally(() => setCargando(false));

  useEffect(() => {
    cargar();
  }, []);

  const crear = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);
    try {
      await api.post('/servicios', {
        ...form,
        precio: Number(form.precio),
        duracion_min: Number(form.duracion_min),
        puntos_otorgados: Number(form.puntos_otorgados),
      });
      setForm(formInicial);
      await cargar();
      setMensaje({ texto: 'Servicio agregado.', exito: true });
    } catch (err) {
      setMensaje({ texto: err.response?.data?.error || 'No se pudo agregar', exito: false });
    } finally {
      setGuardando(false);
    }
  };

  const abrirEdicion = (s) => {
    setEditando(s.id);
    setBorrador({ ...s });
    setMensaje(null);
  };

  const guardarEdicion = async () => {
    try {
      await api.put(`/servicios/${borrador.id}`, {
        nombre: borrador.nombre,
        precio: Number(borrador.precio),
        duracion_min: Number(borrador.duracion_min),
        puntos_otorgados: Number(borrador.puntos_otorgados),
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

  const alternarActivo = async (s) => {
    await api.put(`/servicios/${s.id}`, { activo: s.activo ? 0 : 1 });
    await cargar();
    setMensaje({
      texto: s.activo
        ? 'Desactivado. No lo ven al reservar, pero lo podés volver a activar cuando quieras.'
        : 'Activado de nuevo.',
      exito: true,
    });
  };

  return (
    <PanelPagina
      icono="tijera"
      titulo="Servicios"
      descripcion="Lo que ofrecés y cuánto suma cada corte. Podés cambiar el precio cuando aumentes, y volver a activar lo que hayas dado de baja."
    >
      <Aviso mensaje={mensaje} />

      <form onSubmit={crear} className="card grid sm:grid-cols-4 gap-2 mb-7 animate-aparecer">
        <input
          className="input-dorado"
          placeholder="Nombre"
          required
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
        />
        <input
          className="input-dorado"
          type="number"
          placeholder="Precio"
          required
          value={form.precio}
          onChange={(e) => setForm({ ...form, precio: e.target.value })}
        />
        <input
          className="input-dorado"
          type="number"
          placeholder="Duración (min)"
          value={form.duracion_min}
          onChange={(e) => setForm({ ...form, duracion_min: e.target.value })}
        />
        <input
          className="input-dorado"
          type="number"
          placeholder="Puntos"
          value={form.puntos_otorgados}
          onChange={(e) => setForm({ ...form, puntos_otorgados: e.target.value })}
        />
        <button
          disabled={guardando}
          className="btn-dorado sm:col-span-4 py-3 flex items-center justify-center gap-2"
        >
          <Icono nombre="mas" size={16} grosor={2} />
          {guardando ? 'Agregando…' : 'Agregar servicio'}
        </button>
      </form>

      {cargando ? (
        <Esqueleto lineas={3} />
      ) : servicios.length === 0 ? (
        <Vacio icono="tijera">Todavía no cargaste servicios.</Vacio>
      ) : (
        <div className="flex flex-col gap-2 cascada">
          {servicios.map((s) =>
            editando === s.id ? (
              <div key={s.id} className="card border-dorado/50 animate-aparecer">
                <p className="rotulo-tenue mb-3">Editando</p>
                <div className="grid sm:grid-cols-4 gap-2">
                  <input
                    className="input-dorado"
                    value={borrador.nombre}
                    onChange={(e) => setBorrador({ ...borrador, nombre: e.target.value })}
                  />
                  <input
                    className="input-dorado"
                    type="number"
                    value={borrador.precio}
                    onChange={(e) => setBorrador({ ...borrador, precio: e.target.value })}
                  />
                  <input
                    className="input-dorado"
                    type="number"
                    value={borrador.duracion_min}
                    onChange={(e) => setBorrador({ ...borrador, duracion_min: e.target.value })}
                  />
                  <input
                    className="input-dorado"
                    type="number"
                    value={borrador.puntos_otorgados}
                    onChange={(e) => setBorrador({ ...borrador, puntos_otorgados: e.target.value })}
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
                key={s.id}
                className={`card group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3
                            transition-all duration-300 ${s.activo ? '' : 'opacity-55'}`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
                      s.activo ? 'border-dorado/30 text-dorado' : 'border-borde text-crema/35'
                    }`}
                  >
                    <Icono
                      nombre="tijera"
                      size={18}
                      className="transition-transform duration-500 group-hover:animate-tijeretazo"
                    />
                  </span>
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      {s.nombre}
                      {!s.activo && (
                        <span className="rounded-full border border-borde px-2 py-0.5 text-[10px] uppercase tracking-wider text-crema/45">
                          inactivo
                        </span>
                      )}
                    </p>
                    <p className="text-crema/60 text-sm flex items-center gap-2 mt-0.5">
                      ${s.precio}
                      <span className="text-crema/30">·</span>
                      {s.duracion_min} min
                      <span className="text-crema/30">·</span>
                      <span className="inline-flex items-center gap-1 text-dorado/80">
                        <Icono nombre="estrella" size={12} relleno />
                        {s.puntos_otorgados} pts
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => abrirEdicion(s)} className="btn-outline px-4 py-2 text-[13px]">
                    Editar
                  </button>
                  <button
                    onClick={() => alternarActivo(s)}
                    className={`px-4 py-2 text-[13px] rounded-full border transition-all duration-200 active:scale-[0.97] ${
                      s.activo
                        ? 'border-red-400/40 text-red-400/85 hover:text-red-400 hover:border-red-400/70'
                        : 'border-dorado/50 text-dorado hover:bg-dorado/10'
                    }`}
                  >
                    {s.activo ? 'Desactivar' : 'Activar'}
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
