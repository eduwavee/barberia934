import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import Encabezado from '../components/Encabezado';
import Pantalla from '../components/Pantalla';
import Icono from '../components/Icono';
import useRevelar from '../hooks/useRevelar';
import logoMercadoPago from '../assets/pago-mercadopago.png';
import logoNaranjaX from '../assets/pago-naranjax.png';
import fotoLocal from '../assets/barberia-local.jpg';

const metodos = [
  { nombre: 'Mercado Pago', logo: logoMercadoPago, alto: 'h-11' },
  { nombre: 'Naranja X', logo: logoNaranjaX, alto: 'h-9' },
];

export default function Pagos() {
  const navigate = useNavigate();
  const refEfectivo = useRevelar();

  return (
    <Pantalla className="max-w-md mx-auto pb-28">
      <Encabezado titulo="Medios de pago" volverA="/" />

      <div className="relative">
        {/* Foto de ambiente a sangre detrás de la mitad inferior, como en la referencia */}
        <img
          src={fotoLocal}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] w-full object-cover opacity-40"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-b from-negro via-negro/55 to-negro" />

        <div className="relative flex flex-col px-5 pt-6 min-h-[calc(100vh-9.5rem)]">
          <p className="text-crema/75 text-[15px] mb-4">Elegí tu método de pago:</p>

          <div className="flex flex-col gap-3.5 cascada">
            {metodos.map((m) => (
              <button
                key={m.nombre}
                onClick={() => navigate('/turnos')}
                aria-label={`Pagar con ${m.nombre}`}
                className="card-papel group relative flex items-center justify-center py-7
                           hover:-translate-y-0.5 active:scale-[0.99]"
              >
                <img
                  src={m.logo}
                  alt={m.nombre}
                  className={`${m.alto} w-auto object-contain transition-transform duration-300 group-hover:scale-105`}
                />
                <Icono
                  nombre="flecha"
                  size={19}
                  className="absolute right-6 text-negro/45 transition-transform duration-300 group-hover:translate-x-1"
                />
              </button>
            ))}

            <button
              ref={refEfectivo}
              onClick={() => navigate('/turnos')}
              className="revelable card group relative flex items-center justify-center py-7
                         border-dorado/30 hover:border-dorado/60 active:scale-[0.99]"
            >
              <span className="flex items-center gap-3">
                <Icono nombre="efectivo" size={26} className="text-dorado" />
                <span className="font-bold tracking-wide">Efectivo en el local</span>
              </span>
              <Icono
                nombre="flecha"
                size={19}
                className="absolute right-6 text-crema/35 transition-transform duration-300 group-hover:translate-x-1"
              />
            </button>
          </div>

          <p className="text-crema/45 text-[12px] mt-auto pt-12 pb-2 text-center flex items-center justify-center gap-2">
            <Icono nombre="candado" size={15} className="text-dorado/70" />
            Pagos seguros y protegidos
          </p>
        </div>
      </div>

      <BottomNav />
    </Pantalla>
  );
}
