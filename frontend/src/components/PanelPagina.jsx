import AdminNav from './AdminNav';
import Icono from './Icono';

/**
 * Envoltorio de las pantallas del panel: nav, título y filete, todo igual en
 * todas. Antes cada pantalla repetía el encabezado con variantes propias.
 */
export default function PanelPagina({ icono, titulo, descripcion, acciones, children, ancho = 'max-w-3xl' }) {
  return (
    <div className={`${ancho} mx-auto pb-20`}>
      <AdminNav />
      <div className="px-5 pt-6 animate-entrar-pantalla">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-[22px] flex items-center gap-2.5 animate-aparecer">
              {icono && <Icono nombre={icono} size={21} className="text-dorado" />}
              {titulo}
            </h1>
            {descripcion && (
              <p className="text-crema/50 text-[13px] mt-1.5 max-w-xl leading-relaxed">
                {descripcion}
              </p>
            )}
          </div>
          {acciones}
        </div>
        <div className="filete mt-4 mb-6" />
        {children}
      </div>
    </div>
  );
}

/** Aviso de resultado, con el mismo tratamiento en todo el panel. */
export function Aviso({ mensaje }) {
  if (!mensaje) return null;
  return (
    <p
      role="status"
      className={`text-sm mb-4 flex items-center gap-2 ${
        mensaje.exito ? 'text-dorado animate-aparecer' : 'text-red-400 animate-temblor'
      }`}
    >
      <Icono nombre={mensaje.exito ? 'check' : 'cerrar'} size={15} grosor={2} />
      {mensaje.texto}
    </p>
  );
}
