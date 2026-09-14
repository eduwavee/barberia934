import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import BottomNav from '../components/BottomNav';
import Encabezado from '../components/Encabezado';
import Icono from '../components/Icono';
import { Spinner, Vacio } from '../components/Cargando';

const DIAS_CORTOS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
const DIAS_LARGOS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const metodosPago = [
  { valor: 'efectivo', label: 'Efectivo en el local', icono: 'efectivo' },
  { valor: 'mercadopago', label: 'Mercado Pago', icono: 'tarjeta' },
  { valor: 'naranjax', label: 'Naranja X', icono: 'tarjeta' },
];

function proximosDias(n = 6) {
  const dias = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dias.push({
      fecha: d.toISOString().slice(0, 10),
      nombreDia: DIAS_CORTOS[d.getDay()],
      numero: d.getDate(),
    });
  }
  return dias;
}

/** "2026-09-15" → "Martes 15 de Septiembre" */
function fechaLarga(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  const fecha = new Date(a, m - 1, d);
  return `${DIAS_LARGOS[fecha.getDay()]} ${d} de ${MESES[m - 1]}`;
}

export default function Turnos() {
  const navigate = useNavigate();
  const [servicios, setServicios] = useState([]);
  const [servicioId, setServicioId] = useState(null);
  const [dias] = useState(proximosDias);
  const [fecha, setFecha] = useState(dias[0].fecha);
  const [horarios, setHorarios] = useState([]);
  const [cargandoHorarios, setCargandoHorarios] = useState(true);
  const [hora, setHora] = useState(null);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [mensaje, setMensaje] = useState('');
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    let vigente = true;
    api.get('/servicios').then(({ data }) => {
      if (!vigente) return;
      setServicios(data);
      setServicioId(data[0]?.id);
    });
    return () => {
      vigente = false;
    };
  }, []);

  useEffect(() => {
    let vigente = true;
    setHora(null);
    setCargandoHorarios(true);
    api
      .get('/turnos/disponibilidad', { params: { fecha } })
      .then(({ data }) => {
        if (vigente) setHorarios(data.horarios);
      })
      .finally(() => {
        if (vigente) setCargandoHorarios(false);
      });
    return () => {
      vigente = false;
    };
  }, [fecha]);

  const confirmarTurno = async () => {
    setMensaje('');
    setConfirmando(true);
    try {
      await api.post('/turnos', { servicio_id: servicioId, fecha, hora, metodo_pago: metodoPago });
      navigate('/turnos/mios');
    } catch (err) {
      setMensaje(err.response?.data?.error || 'No pudimos reservar el turno');
    } finally {
      setConfirmando(false);
    }
  };

  return (
    <div className="max-w-md mx-auto pb-28">
      <Encabezado titulo="Sacar turno" volverA="/" />

      <div className="px-5 pt-5">
        {/* Servicio */}
        <p className="rotulo mb-2.5">Servicio</p>
        <div className="flex gap-2 overflow-x-auto carrusel pb-1 mb-6 -mx-5 px-5 cascada">
          {servicios.map((s) => {
            const activo = servicioId === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setServicioId(s.id)}
                aria-pressed={activo}
                className={`min-w-[126px] shrink-0 text-left rounded-xl border px-3.5 py-3 presionable
                            transition-all duration-300 ${
                              activo
                                ? 'bg-dorado text-negro border-dorado'
                                : 'bg-panel border-borde text-crema hover:border-dorado/50'
                            }`}
              >
                <p className="font-medium text-[13px] leading-tight">{s.nombre}</p>
                <p className={`text-[13px] mt-1 ${activo ? 'text-negro/75' : 'text-dorado'}`}>
                  ${s.precio}
                </p>
                <p className={`text-[10px] mt-0.5 ${activo ? 'text-negro/55' : 'text-crema/45'}`}>
                  {s.duracion_min} min · +{s.puntos_otorgados} pts
                </p>
              </button>
            );
          })}
        </div>

        {/* Días */}
        <div className="flex gap-2 overflow-x-auto carrusel pb-1 mb-7 -mx-5 px-5">
          {dias.map((d) => {
            const activo = fecha === d.fecha;
            return (
              <button
                key={d.fecha}
                onClick={() => setFecha(d.fecha)}
                aria-pressed={activo}
                className={`flex shrink-0 flex-col items-center justify-center min-w-[58px] h-[62px]
                            rounded-xl border presionable transition-all duration-300 ${
                              activo
                                ? 'bg-dorado text-negro border-dorado scale-105'
                                : 'bg-panel border-borde text-crema/70 hover:border-dorado/50'
                            }`}
              >
                <span className="text-[10px] tracking-wider">{d.nombreDia}</span>
                <span className="font-semibold text-lg leading-tight">{d.numero}</span>
              </button>
            );
          })}
        </div>

        {/* Horarios */}
        <h2 className="font-semibold mb-3">Horarios disponibles</h2>

        {cargandoHorarios ? (
          <div className="grid grid-cols-3 gap-2.5 mb-6" aria-hidden="true">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="esqueleto h-12" />
            ))}
          </div>
        ) : horarios.length === 0 ? (
          <div className="mb-6">
            <Vacio icono="reloj">No hay horarios libres este día. Probá con otra fecha.</Vacio>
          </div>
        ) : (
          <div key={fecha} className="grid grid-cols-3 gap-2.5 mb-6 cascada">
            {horarios.map((h) => {
              const activo = hora === h;
              return (
                <button
                  key={h}
                  onClick={() => setHora(h)}
                  aria-pressed={activo}
                  className={`h-12 rounded-xl border text-sm presionable transition-all duration-300 ${
                    activo
                      ? 'bg-dorado text-negro border-dorado font-semibold'
                      : 'bg-panel border-borde text-crema hover:border-dorado/50'
                  }`}
                >
                  {h}
                </button>
              );
            })}
          </div>
        )}

        {/* Resumen del turno */}
        {hora && (
          <div className="card mb-4 animate-aparecer">
            <div className="flex items-start gap-3">
              <Icono nombre="calendario" size={20} className="text-dorado mt-0.5 shrink-0" />
              <div>
                <p className="text-crema/50 text-xs">Día seleccionado</p>
                <p className="font-medium text-sm mt-0.5">{fechaLarga(fecha)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 mt-4">
              <Icono nombre="reloj" size={20} className="text-dorado mt-0.5 shrink-0" />
              <div>
                <p className="text-crema/50 text-xs">Horario</p>
                <p className="font-medium text-sm mt-0.5">{hora}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 mt-4">
              <Icono nombre="tarjeta" size={20} className="text-dorado mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-crema/50 text-xs mb-2">Método de pago</p>
                <div className="flex flex-col gap-2">
                  {metodosPago.map((m) => {
                    const activo = metodoPago === m.valor;
                    return (
                      <button
                        key={m.valor}
                        onClick={() => setMetodoPago(m.valor)}
                        aria-pressed={activo}
                        className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-[13px]
                                    presionable transition-all duration-300 ${
                                      activo
                                        ? 'border-dorado bg-dorado/10 text-dorado'
                                        : 'border-borde text-crema/65 hover:border-dorado/40'
                                    }`}
                      >
                        <Icono nombre={m.icono} size={16} />
                        {m.label}
                        {activo && (
                          <Icono
                            nombre="check"
                            size={13}
                            grosor={2.4}
                            className="ml-auto animate-aparecer-escala"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {mensaje && (
              <p className="text-red-400 text-sm mt-4 flex items-center gap-2 animate-temblor" role="alert">
                <Icono nombre="cerrar" size={14} />
                {mensaje}
              </p>
            )}

            <button
              disabled={confirmando}
              onClick={confirmarTurno}
              className="btn-dorado w-full mt-5 flex items-center justify-center gap-2"
            >
              {confirmando ? (
                <>
                  <Spinner size={16} className="text-negro" /> Confirmando…
                </>
              ) : (
                'CONFIRMAR TURNO'
              )}
            </button>
          </div>
        )}

        <div className="flex items-start gap-2.5 mt-5 px-1">
          <Icono nombre="navaja" size={18} className="text-dorado/70 shrink-0 mt-0.5" />
          <p className="text-crema/40 text-[11px] leading-relaxed">
            Tu turno se confirmará una vez realizado el pago o la reserva de puntos.
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
