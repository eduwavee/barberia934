import { useCallback, useEffect, useState } from 'react';
import api from '../api/client';
import PanelPagina, { Aviso } from '../components/PanelPagina';
import Icono from '../components/Icono';
import { Esqueleto, Vacio } from '../components/Cargando';

const ESTADOS = ['pendiente', 'confirmado', 'completado', 'cancelado'];

const colorEstado = {
  pendiente: 'border-dorado/40 text-dorado',
  confirmado: 'border-dorado/40 text-dorado',
  completado: 'border-green-400/40 text-green-400',
  cancelado: 'border-red-400/40 text-red-400',
};

const formMostrador = {
  usuario_id: '',
  nombre: '',
  telefono: '',
  servicio_id: '',
  fecha: '',
  hora: '',
};

export default function TurnosAdmin() {
  const [turnos, setTurnos] = useState([]);
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  // Alta de mostrador
  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState(formMostrador);
  const [servicios, setServicios] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(
    () =>
      api
        .get('/turnos', {
          params: {
            ...(filtroFecha ? { fecha: filtroFecha } : {}),
            ...(filtroEstado ? { estado: filtroEstado } : {}),
          },
        })
        .then(({ data }) => setTurnos(data)),
    [filtroFecha, filtroEstado],
  );

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    cargar().finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, [cargar]);

  // Los datos del alta se piden recién al abrir el formulario
  useEffect(() => {
    if (!abierto || servicios.length) return;
    api.get('/servicios').then(({ data }) => setServicios(data));
    api.get('/usuarios').then(({ data }) => setClientes(data));
  }, [abierto, servicios.length]);

  useEffect(() => {
    if (!form.fecha) return setHorarios([]);
    api
      .get('/turnos/disponibilidad', { params: { fecha: form.fecha } })
      .then(({ data }) => setHorarios(data.horarios));
  }, [form.fecha]);

  const cambiarEstado = async (id, estado) => {
    setActualizando(id);
    try {
      await api.put(`/turnos/${id}/estado`, { estado });
      await cargar();
    } finally {
      setActualizando(null);
    }
  };

  const cargarMostrador = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);
    try {
      await api.post('/turnos/manual', {
        usuario_id: form.usuario_id || undefined,
        nombre: form.usuario_id ? undefined : form.nombre,
        telefono: form.usuario_id ? undefined : form.telefono,
        servicio_id: Number(form.servicio_id),
        fecha: form.fecha,
        hora: form.hora,
      });
      setForm(formMostrador);
      setAbierto(false);
      await cargar();
      setMensaje({ texto: 'Turno cargado y confirmado.', exito: true });
    } catch (err) {
      setMensaje({ texto: err.response?.data?.error || 'No se pudo cargar el turno', exito: false });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <PanelPagina
      icono="calendario"
      titulo="Turnos"
      descripcion="Todo lo reservado desde la app, más lo que cargues vos de mostrador."
      acciones={
        <button
          onClick={() => setAbierto((v) => !v)}
          className="btn-dorado px-5 py-2.5 text-[13px] flex items-center gap-2 shrink-0"
        >
          <Icono nombre={abierto ? 'cerrar' : 'mas'} size={15} grosor={2} />
          {abierto ? 'Cerrar' : 'Cargar turno'}
        </button>
      }
    >
      <Aviso mensaje={mensaje} />

      {/* Alta de mostrador: el que llamó o cayó sin turno */}
      {abierto && (
        <form onSubmit={cargarMostrador} className="card mb-6 animate-subir-panel border-dorado/40">
          <p className="rotulo-tenue mb-3">Turno de mostrador</p>

          <div className="grid sm:grid-cols-2 gap-2 mb-2">
            <select
              className="input-dorado"
              value={form.usuario_id}
              onChange={(e) => setForm({ ...form, usuario_id: e.target.value })}
            >
              <option value="">Cliente nuevo…</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                  {c.telefono ? ` · ${c.telefono}` : ''}
                </option>
              ))}
            </select>

            <select
              className="input-dorado"
              required
              value={form.servicio_id}
              onChange={(e) => setForm({ ...form, servicio_id: e.target.value })}
            >
              <option value="">Servicio…</option>
              {servicios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} · ${s.precio}
                </option>
              ))}
            </select>
          </div>

          {!form.usuario_id && (
            <div className="grid sm:grid-cols-2 gap-2 mb-2 animate-aparecer">
              <input
                className="input-dorado"
                placeholder="Nombre del cliente"
                required
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />
              <input
                className="input-dorado"
                placeholder="Teléfono (opcional)"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              />
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-2">
            <input
              type="date"
              className="input-dorado"
              required
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value, hora: '' })}
            />
            <select
              className="input-dorado"
              required
              disabled={!form.fecha}
              value={form.hora}
              onChange={(e) => setForm({ ...form, hora: e.target.value })}
            >
              <option value="">{form.fecha ? 'Horario…' : 'Elegí la fecha primero'}</option>
              {horarios.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          {form.fecha && horarios.length === 0 && (
            <p className="text-crema/45 text-[12px] mt-2">
              Ese día no tiene horarios libres. Revisá la agenda.
            </p>
          )}

          <button disabled={guardando} className="btn-dorado w-full mt-4 py-3">
            {guardando ? 'Cargando…' : 'CONFIRMAR TURNO'}
          </button>
        </form>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <input
          type="date"
          className="input-dorado sm:w-52 py-2.5"
          value={filtroFecha}
          onChange={(e) => setFiltroFecha(e.target.value)}
        />
        <button
          onClick={() => setFiltroEstado('')}
          aria-pressed={filtroEstado === ''}
          className={`chip px-4 py-2 text-[13px] ${filtroEstado === '' ? 'chip-activo font-semibold' : 'text-crema/70'}`}
        >
          Todos
        </button>
        {ESTADOS.map((e) => (
          <button
            key={e}
            onClick={() => setFiltroEstado(e)}
            aria-pressed={filtroEstado === e}
            className={`chip px-4 py-2 text-[13px] capitalize ${
              filtroEstado === e ? 'chip-activo font-semibold' : 'text-crema/70'
            }`}
          >
            {e}
          </button>
        ))}
        {(filtroFecha || filtroEstado) && (
          <button
            onClick={() => {
              setFiltroFecha('');
              setFiltroEstado('');
            }}
            className="group text-crema/50 hover:text-dorado text-[13px] flex items-center gap-1
                       transition-colors duration-200 animate-entrar-derecha"
          >
            <Icono
              nombre="cerrar"
              size={13}
              className="transition-transform duration-300 group-hover:rotate-90"
            />
            Limpiar
          </button>
        )}
      </div>

      {cargando ? (
        <Esqueleto lineas={3} />
      ) : turnos.length === 0 ? (
        <Vacio icono="calendario">No hay turnos con esos filtros.</Vacio>
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
                  <p className="text-crema/55 text-sm mt-0.5">
                    {t.servicio_nombre} · ${t.precio}
                    {t.cliente_telefono ? ` · ${t.cliente_telefono}` : ''}
                  </p>
                </div>
              </div>
              <select
                className="input-dorado sm:w-44 py-2.5"
                value={t.estado}
                disabled={actualizando === t.id}
                onChange={(e) => cambiarEstado(t.id, e.target.value)}
              >
                {ESTADOS.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </PanelPagina>
  );
}
