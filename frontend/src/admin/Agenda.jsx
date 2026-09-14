import { useEffect, useState } from 'react';
import api from '../api/client';
import PanelPagina from '../components/PanelPagina';
import Icono from '../components/Icono';
import { Esqueleto } from '../components/Cargando';

const INTERVALOS = [15, 20, 30, 45, 60, 90];

/** "2026-09-26" → "Sábado 26 de Septiembre" */
const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
function fechaLarga(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  return `${DIAS[new Date(a, m - 1, d).getDay()]} ${d} de ${MESES[m - 1]}`;
}

export default function Agenda() {
  const [semana, setSemana] = useState([]);
  const [bloqueos, setBloqueos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(null);
  const [mensaje, setMensaje] = useState(null); // { texto, exito }
  const [nuevo, setNuevo] = useState({ fecha: '', hora: '', motivo: '' });

  const cargar = () =>
    Promise.all([api.get('/agenda/horarios'), api.get('/agenda/bloqueos')])
      .then(([h, b]) => {
        setSemana(h.data);
        setBloqueos(b.data);
      })
      .finally(() => setCargando(false));

  useEffect(() => {
    cargar();
  }, []);

  const guardarDia = async (dia, cambios) => {
    const actualizado = { ...semana.find((d) => d.dia_semana === dia), ...cambios };
    setSemana((previa) => previa.map((d) => (d.dia_semana === dia ? actualizado : d)));
    setGuardando(dia);
    setMensaje(null);
    try {
      await api.put(`/agenda/horarios/${dia}`, {
        abierto: actualizado.abierto,
        hora_inicio: actualizado.hora_inicio,
        hora_fin: actualizado.hora_fin,
        intervalo_min: actualizado.intervalo_min,
      });
    } catch (err) {
      setMensaje({ texto: err.response?.data?.error || 'No se pudo guardar', exito: false });
      await cargar();
    } finally {
      setGuardando(null);
    }
  };

  const agregarBloqueo = async (e) => {
    e.preventDefault();
    if (!nuevo.fecha) return;
    setMensaje(null);
    try {
      const { data } = await api.post('/agenda/bloqueos', {
        fecha: nuevo.fecha,
        hora: nuevo.hora || null,
        motivo: nuevo.motivo || null,
      });
      setNuevo({ fecha: '', hora: '', motivo: '' });
      setMensaje({
        texto: data.turnos_cancelados
          ? `Bloqueado. Se cancelaron ${data.turnos_cancelados} turno(s) y se avisó a cada cliente.`
          : 'Bloqueado.',
        exito: true,
      });
      await cargar();
    } catch (err) {
      setMensaje({ texto: err.response?.data?.error || 'No se pudo bloquear', exito: false });
    }
  };

  const quitarBloqueo = async (id) => {
    await api.delete(`/agenda/bloqueos/${id}`);
    setMensaje({ texto: 'Se reabrió. Les avisamos a los clientes sin turno.', exito: true });
    await cargar();
  };

  return (
    <PanelPagina icono="reloj" titulo="Agenda" descripcion="Tus horarios de atención y los días que cerrás.">

        {mensaje && (
          <p
            role="status"
            className={`text-sm mb-4 flex items-center gap-2 ${
              mensaje.exito ? 'text-dorado animate-aparecer' : 'text-red-400 animate-temblor'
            }`}
          >
            <Icono nombre={mensaje.exito ? 'check' : 'cerrar'} size={15} grosor={2} />
            {mensaje.texto}
          </p>
        )}

        {/* Horarios de la semana */}
        <h2 className="rotulo mb-3">Horarios de atención</h2>
        {cargando ? (
          <Esqueleto lineas={4} />
        ) : (
          <div className="flex flex-col gap-2 cascada">
            {semana.map((d) => (
              <div
                key={d.dia_semana}
                className={`card flex flex-col sm:flex-row sm:items-center gap-3 transition-opacity
                            duration-300 ${guardando === d.dia_semana ? 'opacity-50' : ''}`}
              >
                <label className="flex items-center gap-3 sm:w-44 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={d.abierto}
                    onChange={(e) => guardarDia(d.dia_semana, { abierto: e.target.checked })}
                    className="h-4 w-4 accent-[#C9AE8C]"
                  />
                  <span className={`font-medium ${d.abierto ? '' : 'text-crema/40'}`}>{d.nombre}</span>
                </label>

                {d.abierto ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="time"
                      value={d.hora_inicio}
                      onChange={(e) => guardarDia(d.dia_semana, { hora_inicio: e.target.value })}
                      className="input-dorado w-32 py-2"
                    />
                    <span className="text-crema/40">a</span>
                    <input
                      type="time"
                      value={d.hora_fin}
                      onChange={(e) => guardarDia(d.dia_semana, { hora_fin: e.target.value })}
                      className="input-dorado w-32 py-2"
                    />
                    <select
                      value={d.intervalo_min}
                      onChange={(e) =>
                        guardarDia(d.dia_semana, { intervalo_min: Number(e.target.value) })
                      }
                      className="input-dorado w-36 py-2"
                    >
                      {INTERVALOS.map((i) => (
                        <option key={i} value={i}>
                          cada {i} min
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <span className="text-crema/40 text-sm">Cerrado</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Bloqueos puntuales */}
        <h2 className="rotulo mt-8 mb-2">Cerrar un día u horario</h2>
        <p className="text-crema/50 text-[13px] mb-3">
          Para feriados, vacaciones o un turno que te querés guardar. Si ya había turnos reservados
          se cancelan y les avisamos a los clientes.
        </p>

        <form onSubmit={agregarBloqueo} className="card grid sm:grid-cols-4 gap-2 mb-5">
          <input
            type="date"
            required
            value={nuevo.fecha}
            onChange={(e) => setNuevo({ ...nuevo, fecha: e.target.value })}
            className="input-dorado"
          />
          <input
            type="time"
            value={nuevo.hora}
            onChange={(e) => setNuevo({ ...nuevo, hora: e.target.value })}
            className="input-dorado"
            title="Vacío = todo el día"
          />
          <input
            placeholder="Motivo (opcional)"
            value={nuevo.motivo}
            onChange={(e) => setNuevo({ ...nuevo, motivo: e.target.value })}
            className="input-dorado"
          />
          <button className="btn-dorado flex items-center justify-center gap-2 py-3">
            <Icono nombre="mas" size={16} grosor={2} />
            Cerrar
          </button>
          <p className="text-crema/35 text-[11px] sm:col-span-4">
            Dejá la hora vacía para cerrar el día completo.
          </p>
        </form>

        {bloqueos.length > 0 && (
          <div className="flex flex-col gap-2 cascada">
            {bloqueos.map((b) => (
              <div key={b.id} className="card flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-red-400/30 text-red-400">
                    <Icono nombre="cerrar" size={17} />
                  </span>
                  <div>
                    <p className="font-medium">
                      {fechaLarga(b.fecha)}
                      {b.hora ? ` · ${b.hora}` : ' · todo el día'}
                    </p>
                    {b.motivo && <p className="text-crema/50 text-sm mt-0.5">{b.motivo}</p>}
                  </div>
                </div>
                <button
                  onClick={() => quitarBloqueo(b.id)}
                  className="text-dorado hover:text-dorado-claro text-sm transition-colors duration-200"
                >
                  Reabrir
                </button>
              </div>
            ))}
          </div>
        )}
    </PanelPagina>
  );
}
