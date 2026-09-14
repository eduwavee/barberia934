import { useEffect, useState } from 'react';
import api from '../api/client';
import AdminNav from '../components/AdminNav';
import Icono from '../components/Icono';
import { Esqueleto, Vacio } from '../components/Cargando';

const formInicial = { nombre: '', precio: '', duracion_min: 30, puntos_otorgados: 100 };

export default function Servicios() {
  const [servicios, setServicios] = useState([]);
  const [form, setForm] = useState(formInicial);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const cargar = () =>
    api
      .get('/servicios')
      .then(({ data }) => setServicios(data))
      .finally(() => setCargando(false));

  useEffect(() => {
    cargar();
  }, []);

  const crear = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await api.post('/servicios', {
        ...form,
        precio: Number(form.precio),
        duracion_min: Number(form.duracion_min),
        puntos_otorgados: Number(form.puntos_otorgados),
      });
      setForm(formInicial);
      await cargar();
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (id) => {
    await api.delete(`/servicios/${id}`);
    await cargar();
  };

  return (
    <div className="max-w-3xl mx-auto pb-16">
      <AdminNav />
      <div className="px-5 pt-6">
        <h1 className="font-display text-[22px] mb-1 flex items-center gap-2 animate-aparecer">
          <Icono nombre="tijera" size={22} className="text-dorado" />
          Servicios
        </h1>
        <div className="filete mb-5" />

        <form onSubmit={crear} className="card grid sm:grid-cols-4 gap-2 mb-6 animate-aparecer">
          <input
            className="input-dorado"
            placeholder="Nombre"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          />
          <input
            className="input-dorado"
            type="number"
            placeholder="Precio"
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
            className="btn-dorado sm:col-span-4 flex items-center justify-center gap-2"
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
            {servicios.map((s) => (
              <div key={s.id} className="card group flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-dorado/30 text-dorado">
                    <Icono
                      nombre="tijera"
                      size={18}
                      className="transition-transform duration-500 group-hover:animate-tijeretazo"
                    />
                  </span>
                  <div>
                    <p className="font-medium">{s.nombre}</p>
                    <p className="text-crema/60 text-sm flex items-center gap-2">
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
                <button
                  onClick={() => eliminar(s.id)}
                  className="text-red-400/80 hover:text-red-400 text-sm flex items-center gap-1.5
                             transition-colors duration-200"
                >
                  <Icono nombre="cerrar" size={13} />
                  Desactivar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
