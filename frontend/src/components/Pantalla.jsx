import { useLocation } from 'react-router-dom';

/**
 * Envoltorio de cada pantalla: al cambiar de ruta vuelve a montar el contenido
 * con una entrada suave, así navegar no es un corte seco.
 */
export default function Pantalla({ children, className = '' }) {
  const { pathname } = useLocation();

  return (
    <div key={pathname} className={`animate-entrar-pantalla ${className}`}>
      {children}
    </div>
  );
}
