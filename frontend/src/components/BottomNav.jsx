import { NavLink } from 'react-router-dom';
import Icono from './Icono';

const items = [
  { to: '/', label: 'Inicio', icono: 'inicio', end: true },
  { to: '/turnos', label: 'Turnos', icono: 'calendario' },
  { to: '/puntos', label: 'Puntos', icono: 'estrella' },
  { to: '/pagos', label: 'Pagos', icono: 'tarjeta' },
  { to: '/ubicacion', label: 'Más', icono: 'menu' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 max-w-md mx-auto bg-negro/95 backdrop-blur border-t border-borde">
      <div className="flex justify-around pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))]">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-1.5 px-3 text-[10px] tracking-wide presionable ${
                isActive ? 'text-dorado' : 'text-crema/45 hover:text-crema/75'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`absolute -top-2.5 h-[2px] rounded-full bg-dorado transition-all duration-300 ${
                    isActive ? 'w-6 opacity-100' : 'w-0 opacity-0'
                  }`}
                />
                <Icono
                  nombre={item.icono}
                  size={21}
                  className={`transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}
                />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
