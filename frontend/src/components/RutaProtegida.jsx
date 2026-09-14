import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

export default function RutaProtegida({ children, soloDueño = false }) {
  const { usuario, cargando } = useAuth();

  // Mientras se valida el token, el sello late en el centro en vez de dejar la pantalla en negro.
  if (cargando) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Logo size={72} halo />
        <p className="text-crema/40 text-sm tracking-[0.25em] animate-pulse">CARGANDO</p>
      </div>
    );
  }

  if (!usuario) return <Navigate to="/login" replace />;
  if (soloDueño && usuario.rol !== 'dueño') return <Navigate to="/" replace />;
  return children;
}
