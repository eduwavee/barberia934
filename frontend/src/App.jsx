import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import RutaProtegida from './components/RutaProtegida';

import Login from './pages/Login';
import Home from './pages/Home';
import Turnos from './pages/Turnos';
import MisTurnos from './pages/MisTurnos';
import MisPuntos from './pages/MisPuntos';
import Pagos from './pages/Pagos';
import Ubicacion from './pages/Ubicacion';

import Dashboard from './admin/Dashboard';
import Ingresos from './admin/Ingresos';
import TurnosAdmin from './admin/TurnosAdmin';
import Servicios from './admin/Servicios';
import Productos from './admin/Productos';
import Clientes from './admin/Clientes';

function InicioSegunRol() {
  const { usuario, cargando } = useAuth();
  if (cargando) return null;
  if (!usuario) return <Navigate to="/login" replace />;
  if (usuario.rol === 'dueño') return <Navigate to="/admin" replace />;
  return <Home />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Login vistaInicial="registrar" />} />

          {/* Cliente */}
          <Route path="/" element={<RutaProtegida><InicioSegunRol /></RutaProtegida>} />
          <Route path="/turnos" element={<RutaProtegida><Turnos /></RutaProtegida>} />
          <Route path="/turnos/mios" element={<RutaProtegida><MisTurnos /></RutaProtegida>} />
          <Route path="/puntos" element={<RutaProtegida><MisPuntos /></RutaProtegida>} />
          <Route path="/pagos" element={<RutaProtegida><Pagos /></RutaProtegida>} />
          <Route path="/ubicacion" element={<RutaProtegida><Ubicacion /></RutaProtegida>} />

          {/* Dueño */}
          <Route path="/admin" element={<RutaProtegida soloDueño><Dashboard /></RutaProtegida>} />
          <Route path="/admin/ingresos" element={<RutaProtegida soloDueño><Ingresos /></RutaProtegida>} />
          <Route path="/admin/turnos" element={<RutaProtegida soloDueño><TurnosAdmin /></RutaProtegida>} />
          <Route path="/admin/servicios" element={<RutaProtegida soloDueño><Servicios /></RutaProtegida>} />
          <Route path="/admin/productos" element={<RutaProtegida soloDueño><Productos /></RutaProtegida>} />
          <Route path="/admin/clientes" element={<RutaProtegida soloDueño><Clientes /></RutaProtegida>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
