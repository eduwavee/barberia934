import { useCallback, useEffect, useState } from 'react';
import api from '../api/client';
import PanelPagina from '../components/PanelPagina';
import Icono from '../components/Icono';
import { Esqueleto, Vacio } from '../components/Cargando';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
function fechaLarga(iso) {
  if (!iso) return '';
  const [a, m, d] = iso.split('-').map(Number);
  return `${DIAS[new Date(a, m - 1, d).getDay()]} ${d} de ${MESES[m - 1]}`;
}

/** Teléfono a formato wa.me: sólo dígitos, con el 54 de Argentina si falta. */
function aWhatsapp(telefono = '') {
  const digitos = telefono.replace(/\D/g, '');
  if (!digitos) return null;
  if (digitos.startsWith('54')) return digitos;
  return `54${digitos.replace(/^0/, '')}`;
}

export default function Recordatorios() {
  const [dias, setDias] = useState(1);
  const [datos, setDatos] = useState({ fecha: '', turnos: [] });
  const [cargando, setCargando] = useState(true);
  const [enviados, setEnviados] = useState(() => new Set());

  const cargar = useCallback(() => {
    setCargando(true);
    return api
      .get('/turnos/recordatorios', { params: { dias } })
      .then(({ data }) => setDatos(data))
      .finally(() => setCargando(false));
  }, [dias]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const marcarEnviado = (id) => setEnviados((previos) => new Set(previos).add(id));

  return (
    <PanelPagina icono="whatsapp" titulo="Recordatorios">

        <p className="text-crema/60 text-[14px] mb-4">
          Mandales un recordatorio por WhatsApp a los que tienen turno. El mensaje ya viene escrito:
          tocás, se abre el chat y sólo apretás enviar.
        </p>

        <div className="flex items-center gap-2 mb-5">
          {[
            { valor: 1, texto: 'Mañana' },
            { valor: 0, texto: 'Hoy' },
            { valor: 2, texto: 'Pasado' },
          ].map((o) => (
            <button
              key={o.valor}
              onClick={() => setDias(o.valor)}
              aria-pressed={dias === o.valor}
              className={`chip px-4 py-2 text-sm ${dias === o.valor ? 'chip-activo font-semibold' : 'text-crema/70'}`}
            >
              {o.texto}
            </button>
          ))}
          <span className="text-crema/45 text-[13px] ml-2">{fechaLarga(datos.fecha)}</span>
        </div>

        {cargando ? (
          <Esqueleto lineas={3} />
        ) : datos.turnos.length === 0 ? (
          <Vacio icono="calendario">No hay turnos para ese día.</Vacio>
        ) : (
          <div className="flex flex-col gap-2 cascada">
            {datos.turnos.map((t) => {
              const numero = aWhatsapp(t.cliente_telefono);
              const yaEnviado = enviados.has(t.id);
              return (
                <div key={t.id} className="card flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${
                        yaEnviado
                          ? 'border-green-400/40 text-green-400'
                          : 'border-dorado/40 text-dorado'
                      }`}
                    >
                      <Icono nombre={yaEnviado ? 'check' : 'reloj'} size={18} />
                    </span>
                    <div>
                      <p className="font-medium">
                        {t.hora} · {t.cliente_nombre}
                      </p>
                      <p className="text-crema/55 text-sm mt-0.5">
                        {t.servicio_nombre}
                        {t.cliente_telefono ? ` · ${t.cliente_telefono}` : ' · sin teléfono'}
                      </p>
                    </div>
                  </div>

                  {numero ? (
                    <a
                      href={`https://wa.me/${numero}?text=${encodeURIComponent(t.mensaje)}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => marcarEnviado(t.id)}
                      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5
                                  text-[13px] font-semibold transition-all duration-200 active:scale-[0.97] ${
                                    yaEnviado
                                      ? 'border border-dorado/40 text-dorado'
                                      : 'bg-dorado text-negro hover:bg-dorado-claro'
                                  }`}
                    >
                      <Icono nombre="whatsapp" size={16} />
                      {yaEnviado ? 'Enviado' : 'Recordar'}
                    </a>
                  ) : (
                    <span className="text-crema/35 text-[12px] whitespace-nowrap">
                      Sin teléfono cargado
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
    </PanelPagina>
  );
}
