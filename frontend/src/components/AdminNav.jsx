import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icono from './Icono';

const items = [
  { to: '/admin', label: 'Panel', icono: 'panel', end: true },
  { to: '/admin/turnos', label: 'Turnos', icono: 'calendario' },
  { to: '/admin/ingresos', label: 'Ingresos', icono: 'ingresos' },
  { to: '/admin/servicios', label: 'Servicios', icono: 'tijera' },
  { to: '/admin/productos', label: 'Canjes', icono: 'regalo' },
  { to: '/admin/clientes', label: 'Clientes', icono: 'clientes' },
];

export default function AdminNav() {
  const { logout } = useAuth();

  return (
    <nav className="sticky top-0 z-20 bg-negro/95 backdrop-blur border-b border-borde">
      <div className="px-4 py-3 flex gap-1 overflow-x-auto carrusel items-center">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            className={({ isActive }) =>
              `flex items-center gap-2 text-sm whitespace-nowrap rounded-lg px-3 py-1.5 presionable
               transition-colors duration-200 ${
                 isActive
                   ? 'text-dorado bg-dorado/10 font-semibold'
                   : 'text-crema/55 hover:text-crema/85 hover:bg-crema/5'
               }`
            }
          >
            {({ isActive }) => (
              <>
                <Icono
                  nombre={it.icono}
                  size={17}
                  className={`transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}
                />
                {it.label}
              </>
            )}
          </NavLink>
        ))}
        <button
          onClick={logout}
          className="group flex items-center gap-2 text-sm text-crema/40 hover:text-red-400 ml-auto whitespace-nowrap
                     rounded-lg px-3 py-1.5 transition-colors duration-200"
        >
          <Icono
            nombre="salir"
            size={17}
            className="transition-transform duration-300 group-hover:translate-x-0.5"
          />
          Salir
        </button>
      </div>
      <div className="filete" />
    </nav>
  );
}
