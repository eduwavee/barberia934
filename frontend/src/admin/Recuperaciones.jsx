import { useEffect, useState } from 'react';
import api from '../api/client';
import AdminNav from '../components/AdminNav';
import Icono from '../components/Icono';
import { Esqueleto, Vacio } from '../components/Cargando';

/** Teléfono a formato wa.me: sólo dígitos, con el 54 de Argentina si falta. */
function aWhatsapp(telefono = '') {
  const digitos = (telefono || '').replace(/\D/g, '');
  if (!digitos) return null;
  return digitos.startsWith('54') ? digitos : `54${digitos.replace(/^0/, '')}`;
}

export default function Recuperaciones() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [enlaces, setEnlaces] = useState({}); // id -> enlace generado
  const [generando, setGenerando] = useState(null);

  const cargar = () =>
    api
      .get('/auth/recuperaciones')
      .then(({ data }) => setPedidos(data))
      .finally(() => setCargando(false));

  useEffect(() => {
    cargar();
  }, []);

  const generar = async (id) => {
    setGenerando(id);
    try {
      const { data } = await api.post(`/auth/recuperaciones/${id}/enlace`);
      setEnlaces((previos) => ({ ...previos, [id]: data }));
    } finally {
      setGenerando(null);
    }
  };

  const copiar = (texto) => navigator.clipboard?.writeText(texto);

  return (
    <div className="max-w-3xl mx-auto pb-16">
      <AdminNav />
      <div className="px-5 pt-6">
        <h1 className="font-display text-[22px] mb-1 flex items-center gap-2 animate-aparecer">
          <Icono nombre="candado" size={22} className="text-dorado" />
          Recuperar contraseñas
        </h1>
        <div className="filete mb-5" />

        <p className="text-crema/60 text-[14px] mb-5">
          Clientes que pidieron recuperar su contraseña. Generás el enlace y se lo pasás por
          WhatsApp. Cada enlace sirve una sola vez y vence en una hora.
        </p>

        {cargando ? (
          <Esqueleto lineas={2} />
        ) : pedidos.length === 0 ? (
          <Vacio icono="candado">No hay pedidos pendientes.</Vacio>
        ) : (
          <div className="flex flex-col gap-2 cascada">
            {pedidos.map((p) => {
              const numero = aWhatsapp(p.telefono);
              const generado = enlaces[p.id];
              return (
                <div key={p.id} className="card">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-dorado/40 text-dorado">
                        <Icono nombre="candado" size={18} />
                      </span>
                      <div>
                        <p className="font-medium">{p.cliente_nombre}</p>
                        <p className="text-crema/55 text-sm mt-0.5">
                          {p.email}
                          {p.telefono ? ` · ${p.telefono}` : ' · sin teléfono'}
                        </p>
                      </div>
                    </div>

                    {!generado && (
                      <button
                        onClick={() => generar(p.id)}
                        disabled={generando === p.id}
                        className="btn-dorado px-5 py-2.5 text-[13px] whitespace-nowrap"
                      >
                        {generando === p.id ? 'Generando…' : 'Generar enlace'}
                      </button>
                    )}
                  </div>

                  {generado && (
                    <div className="mt-4 animate-aparecer">
                      <p className="rotulo-tenue mb-2">
                        Enlace de un solo uso · vence en {generado.vence_en_minutos} min
                      </p>
                      <p className="text-[12px] break-all rounded-lg border border-dorado/25 bg-negro/50 px-3 py-2.5 text-crema/75">
                        {generado.enlace}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {numero && (
                          <a
                            href={`https://wa.me/${numero}?text=${encodeURIComponent(
                              `¡Hola ${p.cliente_nombre.split(' ')[0]}! Con este enlace podés poner una contraseña nueva en Barbería 9 ¾: ${generado.enlace} (vence en 1 hora y sirve una sola vez).`,
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-full bg-dorado px-5 py-2.5 text-[13px]
                                       font-semibold text-negro transition-all duration-200
                                       hover:bg-dorado-claro active:scale-[0.97]"
                          >
                            <Icono nombre="whatsapp" size={16} />
                            Mandar por WhatsApp
                          </a>
                        )}
                        <button
                          onClick={() => copiar(generado.enlace)}
                          className="btn-outline px-5 py-2.5 text-[13px]"
                        >
                          Copiar enlace
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
