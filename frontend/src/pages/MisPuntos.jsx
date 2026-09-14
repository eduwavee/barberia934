import { useEffect, useState } from 'react';
import api from '../api/client';
import BottomNav from '../components/BottomNav';
import Encabezado from '../components/Encabezado';
import Icono from '../components/Icono';
import MedallonPuntos from '../components/MedallonPuntos';
import { Vacio } from '../components/Cargando';
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
  const [productos, setProductos] = useState([]);
  const [mensaje, setMensaje] = useState(null); // { texto, exito }
  const [canjeando, setCanjeando] = useState(null);
  const [verTodos, setVerTodos] = useState(false);

  const cargar = () => {
    api.get('/puntos/mis-puntos').then(({ data }) => {
      setPuntos(data.puntos);
      setHistorial(data.historial);
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
    <div className="max-w-md mx-auto pb-28">
      <Encabezado titulo="Mis puntos" volverA="/" />

      <div className="px-5 pt-6">
        <MedallonPuntos puntos={puntos} />

        <div className="text-center mt-6 animate-aparecer">
          <p className="font-semibold text-[17px]">¡Sumá puntos con cada turno!</p>
          <p className="text-crema/50 text-[13px] leading-relaxed mt-2 px-2">
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

        <h2 className="rotulo mt-8 mb-3">Productos canjeables</h2>

        {productos.length === 0 ? (
          <Vacio icono="regalo">Todavía no hay productos para canjear.</Vacio>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2.5 cascada">
              {visibles.map((p) => {
                const alcanza = puntos >= p.puntos_requeridos && p.stock > 0;
                const foto = fotoDe(p.nombre);
                return (
                  <div
                    key={p.id}
                    className="flex flex-col rounded-xl border border-borde bg-panel overflow-hidden
                               transition-all duration-300 hover:border-dorado/40"
                  >
                    <div className="h-[88px] flex items-center justify-center bg-gradient-to-b from-white/[0.04] to-transparent p-2">
                      {foto ? (
                        <img
                          src={foto}
                          alt={p.nombre}
                          className="max-h-full max-w-full object-contain transition-transform duration-300 hover:scale-105"
                        />
                      ) : (
                        <Icono nombre="regalo" size={32} className="text-dorado/45" />
                      )}
                    </div>
                    <div className="px-2 pb-2.5 pt-1 text-center">
                      <p className="text-[11px] leading-tight text-crema/85 min-h-[26px]">{p.nombre}</p>
                      <p className="text-dorado text-[13px] font-semibold mt-1">
                        {p.puntos_requeridos} pts
                      </p>
                      <button
                        disabled={!alcanza || canjeando === p.id}
                        onClick={() => canjear(p)}
                        className="mt-2 w-full rounded-md bg-dorado py-1.5 text-[10px] font-semibold
                                   tracking-wider text-negro transition-all duration-200
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

            {productos.length > 3 && (
              <button
                onClick={() => setVerTodos((v) => !v)}
                className="btn-outline w-full mt-4 text-[13px]"
              >
                {verTodos ? 'VER MENOS' : 'VER TODOS LOS PRODUCTOS'}
              </button>
            )}
          </>
        )}

        {historial.length > 0 && (
          <>
            <h2 className="rotulo mt-8 mb-2">Historial</h2>
            <div className="flex flex-col cascada">
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
    </div>
  );
}
