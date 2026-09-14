import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import Encabezado from '../components/Encabezado';
import Icono from '../components/Icono';
import logoMercadoPago from '../assets/pago-mercadopago.png';
import logoNaranjaX from '../assets/pago-naranjax.png';
import fotoLocal from '../assets/barberia-local.jpg';

const metodos = [
  { nombre: 'Mercado Pago', logo: logoMercadoPago, alto: 'h-9' },
  { nombre: 'Naranja X', logo: logoNaranjaX, alto: 'h-7' },
];

export default function Pagos() {
  const navigate = useNavigate();

  return (
    <div className="max-w-md mx-auto pb-28">
      <Encabezado titulo="Medios de pago" volverA="/" />

      <div className="px-5 pt-6">
        <p className="text-crema/70 text-sm mb-4">Elegí tu método de pago:</p>

        <div className="flex flex-col gap-3 cascada">
          {metodos.map((m) => (
            <button
              key={m.nombre}
              onClick={() => navigate('/turnos')}
              className="card-papel bg-white group flex items-center justify-between py-6 px-6
                         hover:-translate-y-0.5 active:scale-[0.99]"
            >
              <img src={m.logo} alt={m.nombre} className={`${m.alto} w-auto object-contain`} />
              <Icono
                nombre="flecha"
                size={18}
                className="text-negro/40 transition-transform duration-300 group-hover:translate-x-1"
              />
            </button>
          ))}

          <button
            onClick={() => navigate('/turnos')}
            className="card group flex items-center justify-between py-6 px-6 border-dorado/30
                       hover:border-dorado/60 active:scale-[0.99]"
          >
            <span className="flex items-center gap-3">
              <Icono nombre="efectivo" size={26} className="text-dorado" />
              <span className="font-semibold tracking-wide">Efectivo en el local</span>
            </span>
            <Icono
              nombre="flecha"
              size={18}
              className="text-crema/35 transition-transform duration-300 group-hover:translate-x-1"
            />
          </button>
        </div>

        {/* Foto de ambiente, como en la referencia */}
        <div className="mt-5 h-36 rounded-2xl overflow-hidden border border-borde animate-aparecer-escala">
          <img
            src={fotoLocal}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover opacity-70"
          />
        </div>

        <p className="text-crema/40 text-[11px] mt-6 text-center flex items-center justify-center gap-2">
          <Icono nombre="candado" size={14} className="text-dorado/70" />
          Pagos seguros y protegidos
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
