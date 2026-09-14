import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import Icono from '../components/Icono';
import { Spinner } from '../components/Cargando';
import logo from '../assets/logo.jpeg';
import fondoLocal from '../assets/barberia-local.jpg';

/**
 * Dos pantallas en una:
 * - sin token en la URL: el cliente pide recuperar su contraseña
 * - con token: define la contraseña nueva desde el enlace que le pasaron
 */
export default function Recuperar() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [valor, setValor] = useState('');
  const [estado, setEstado] = useState(null); // { texto, exito }
  const [cargando, setCargando] = useState(false);

  const pedir = async (e) => {
    e.preventDefault();
    setCargando(true);
    setEstado(null);
    try {
      const { data } = await api.post('/auth/recuperar', { email: valor });
      setEstado({ texto: data.mensaje, exito: true });
      setValor('');
    } catch (err) {
      setEstado({
        texto: err.response?.data?.error || 'No pudimos registrar el pedido',
        exito: false,
      });
    } finally {
      setCargando(false);
    }
  };

  const restablecer = async (e) => {
    e.preventDefault();
    setCargando(true);
    setEstado(null);
    try {
      await api.post(`/auth/recuperar/${token}`, { password: valor });
      setEstado({ texto: 'Listo, ya podés entrar con tu contraseña nueva.', exito: true });
      setTimeout(() => navigate('/login'), 1600);
    } catch (err) {
      setEstado({
        texto: err.response?.data?.error || 'No pudimos cambiar la contraseña',
        exito: false,
      });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="relative min-h-screen max-w-md mx-auto overflow-hidden">
      <img
        src={fondoLocal}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-negro/85 via-negro/50 to-negro" />

      <div className="relative min-h-screen flex flex-col items-center justify-center px-7 py-12">
        <img
          src={logo}
          alt="Barbería 9 ¾"
          className="w-24 h-24 rounded-full object-cover shadow-sello animate-sello"
        />

        <h1 className="text-[22px] font-bold mt-6 text-center animate-aparecer">
          {token ? 'Nueva contraseña' : 'Recuperar contraseña'}
        </h1>
        <p className="text-crema/55 text-[13px] mt-2 text-center leading-relaxed animate-aparecer">
          {token
            ? 'Elegí una contraseña nueva para tu cuenta.'
            : 'Dejanos tu email y Jacob te pasa el enlace por WhatsApp para volver a entrar.'}
        </p>

        <form
          onSubmit={token ? restablecer : pedir}
          className="w-full flex flex-col gap-3 mt-7 animate-subir-panel"
        >
          <input
            type={token ? 'password' : 'email'}
            required
            minLength={token ? 6 : undefined}
            placeholder={token ? 'Contraseña nueva (mínimo 6)' : 'Tu email'}
            autoComplete={token ? 'new-password' : 'email'}
            className="input-dorado"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
          />

          {estado && (
            <p
              role="status"
              className={`text-sm flex items-start gap-2 ${
                estado.exito ? 'text-dorado animate-aparecer' : 'text-red-400 animate-temblor'
              }`}
            >
              <Icono
                nombre={estado.exito ? 'check' : 'cerrar'}
                size={15}
                grosor={2}
                className="mt-0.5 shrink-0"
              />
              {estado.texto}
            </p>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="btn-dorado flex items-center justify-center gap-2"
          >
            {cargando ? (
              <>
                <Spinner size={16} className="text-negro" /> Enviando…
              </>
            ) : token ? (
              'GUARDAR CONTRASEÑA'
            ) : (
              'PEDIR ENLACE'
            )}
          </button>
        </form>

        <Link
          to="/login"
          className="group text-dorado text-sm mt-5 flex items-center gap-1.5 hover:text-dorado-claro transition-colors duration-200"
        >
          <Icono
            nombre="atras"
            size={14}
            className="transition-transform duration-300 group-hover:-translate-x-1"
          />
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
