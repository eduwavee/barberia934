import { useEffect, useState } from 'react';
import api from '../api/client';
import BottomNav from '../components/BottomNav';
import Encabezado from '../components/Encabezado';
import Icono from '../components/Icono';
import MedallonPuntos from '../components/MedallonPuntos';
import { Vacio } from '../components/Cargando';
import Pantalla from '../components/Pantalla';
import useRevelar from '../hooks/useRevelar';
import imgCera from '../assets/producto-cera.png';
import imgPolvo from '../assets/producto-polvo.png';
import imgAceite from '../assets/producto-aceite.png';

/** Foto del catálogo según el nombre del producto cargado por el dueño. */
const fotos = [
  { clave: 'cera', src: imgCera },
  { clave: 'polvo', src: imgPolvo },
  { clave: 'aceite', src: imgAceite },
];

function fotoDe(nombre = '') {
  const n = nombre.toLowerCase();
  return fotos.find((f) => n.includes(f.clave))?.src ?? null;
}

export default function MisPuntos() {
  const [puntos, setPuntos] = useState(0);
  const [historial, setHistorial] = useState([]);
  const [canjes, setCanjes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [mensaje, setMensaje] = useState(null); // { texto, exito }
  const [canjeando, setCanjeando] = useState(null);
  const [verTodos, setVerTodos] = useState(false);
  const refProductos = useRevelar();
  const refHistorial = useRevelar();

  const cargar = () => {
    api.get('/puntos/mis-puntos').then(({ data }) => {
      setPuntos(data.puntos);
      setHistorial(data.historial);
      setCanjes(data.canjes ?? []);
    });
    api.get('/puntos/productos').then(({ data }) => setProductos(data));
  };

  useEffect(() => {
    cargar();
  }, []);

  const canjear = async (producto) => {
    setMensaje(null);
    setCanjeando(producto.id);
    try {
      await api.post('/puntos/canjear', { producto_id: producto.id });
      setMensaje({ texto: `¡Canjeaste ${producto.nombre}!`, exito: true });
      cargar();
    } catch (err) {
      setMensaje({ texto: err.response?.data?.error || 'No se pudo canjear', exito: false });
    } finally {
      setCanjeando(null);
    }
  };

  const visibles = verTodos ? productos : productos.slice(0, 3);

  return (
    <Pantalla className="max-w-md mx-auto pb-28">
      <Encabezado titulo="Mis puntos" volverA="/" />

      <div className="px-5 pt-6">
        <MedallonPuntos puntos={puntos} />

        <div className="text-center mt-7 animate-aparecer">
          <p className="text-[19px] font-bold">¡Sumá puntos con cada turno!</p>
          <p className="text-crema/55 text-[14px] leading-relaxed mt-2.5 px-3">
            Por cada turno que saques, sumás puntos. Podés canjearlos por productos en el local.
          </p>
        </div>

        {mensaje && (
          <p
            role="status"
            className={`text-sm mt-4 text-center flex items-center justify-center gap-2 ${
              mensaje.exito ? 'text-dorado animate-aparecer-escala' : 'text-red-400 animate-temblor'
            }`}
          >
            <Icono nombre={mensaje.exito ? 'check' : 'cerrar'} size={15} grosor={2} />
            {mensaje.texto}
          </p>
        )}

        <h2 className="rotulo mt-9 mb-3.5">Productos canjeables</h2>

        {productos.length === 0 ? (
          <Vacio icono="regalo">Todavía no hay productos para canjear.</Vacio>
        ) : (
          <>
            <div ref={refProductos} className="revelable grid grid-cols-3 gap-2.5">
              {visibles.map((p) => {
                const alcanza = puntos >= p.puntos_requeridos && p.stock > 0;
                const foto = fotoDe(p.nombre);
                return (
                  <div
                    key={p.id}
                    className="group flex flex-col rounded-2xl border border-dorado/25 bg-panel
                               overflow-hidden transition-all duration-300 hover:border-dorado/60
                               hover:-translate-y-0.5"
                  >
                    <div className="h-[88px] flex items-center justify-center bg-gradient-to-b from-white/[0.04] to-transparent p-2">
                      {foto ? (
                        <img
                          src={foto}
                          alt={p.nombre}
                          className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <Icono nombre="regalo" size={32} className="text-dorado/45" />
                      )}
                    </div>
                    <div className="px-2 pb-2.5 pt-1 text-center">
                      <p className="text-[11px] leading-tight text-crema/70 min-h-[26px]">{p.nombre}</p>
                      <p className="text-[14px] font-bold mt-1">{p.puntos_requeridos} pts</p>
                      <button
                        disabled={!alcanza || canjeando === p.id}
                        onClick={() => canjear(p)}
                        className="mt-2.5 w-full rounded-lg bg-dorado py-2 text-[10px] font-bold
                                   tracking-[0.12em] text-negro transition-all duration-200
                                   hover:bg-dorado-claro active:scale-[0.96] disabled:opacity-25
                                   disabled:hover:bg-dorado"
                      >
                        {p.stock <= 0 ? 'SIN STOCK' : canjeando === p.id ? '...' : 'CANJEAR'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setVerTodos((v) => !v)}
              disabled={productos.length <= 3}
              className="btn-outline w-full mt-4 text-[13px] disabled:opacity-45 disabled:active:scale-100"
            >
              {verTodos ? 'VER MENOS' : 'VER TODOS LOS PRODUCTOS'}
            </button>
          </>
        )}

        {canjes.length > 0 && (
          <>
            <h2 className="rotulo mt-9 mb-2">Lo que canjeaste</h2>
            <div className="flex flex-col">
              {canjes.map((c, i) => (
                <div
                  key={`${c.fecha}-${i}`}
                  className="flex justify-between items-center text-[13px] border-b border-borde py-3"
                >
                  <span className="flex items-center gap-2 text-crema/80">
                    <Icono nombre="regalo" size={14} className="text-dorado/60" />
                    {c.producto}
                    <span className="text-crema/40">· {c.fecha?.slice(0, 10)}</span>
                  </span>
                  <span className="text-crema/50 font-semibold">−{c.puntos_usados}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {historial.length > 0 && (
          <>
            <h2 className="rotulo mt-9 mb-2">Puntos que sumaste</h2>
            <div ref={refHistorial} className="revelable flex flex-col">
              {historial.map((h, i) => (
                <div
                  key={`${h.fecha}-${h.servicio}-${i}`}
                  className="flex justify-between items-center text-[13px] border-b border-borde py-3"
                >
                  <span className="flex items-center gap-2 text-crema/80">
                    <Icono nombre="tijera" size={14} className="text-dorado/60" />
                    {h.servicio}
                    <span className="text-crema/40">· {h.fecha}</span>
                  </span>
                  <span className="text-dorado font-semibold">+{h.puntos_otorgados}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </Pantalla>
  );
}
