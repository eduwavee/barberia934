import { useNavigate } from 'react-router-dom';
import Icono from './Icono';

/**
 * Barra superior de las pantallas internas: flecha de volver a la izquierda
 * y título centrado, como en la referencia de diseño.
 */
export default function Encabezado({ titulo, volverA }) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-20 bg-negro/95 backdrop-blur">
      <div className="relative flex items-center justify-center h-14 px-4">
        <button
          onClick={() => (volverA ? navigate(volverA) : navigate(-1))}
          aria-label="Volver"
          className="absolute left-3 p-2 -m-2 text-crema/80 hover:text-dorado transition-all
                     duration-200 active:scale-90 hover:-translate-x-0.5"
        >
          <Icono nombre="atras" size={20} />
        </button>
        <h1 className="font-medium tracking-wide animate-aparecer">{titulo}</h1>
      </div>
      <div className="filete" />
    </header>
  );
}
