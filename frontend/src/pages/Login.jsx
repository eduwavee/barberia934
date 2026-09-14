import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icono from '../components/Icono';
import { Spinner } from '../components/Cargando';
import logo from '../assets/logo.jpeg';
import fondoLocal from '../assets/barberia-local.jpg';

/** Portada de la app: foto del local, sello y los dos accesos. */
export default function Login({ vistaInicial = 'portada' }) {
  const { login, registrar } = useAuth();
  const navigate = useNavigate();

  // 'portada' | 'ingresar' | 'registrar'
  const [vista, setVista] = useState(vistaInicial);
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', password: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      if (vista === 'ingresar') await login(form.email, form.password);
      else await registrar(form);
      navigate('/');
    } catch (err) {
      const porDefecto =
        vista === 'ingresar' ? 'No pudimos iniciar sesión' : 'No pudimos crear tu cuenta';
      setError(err.response?.data?.error || porDefecto);
    } finally {
      setCargando(false);
    }
  };

  const volverAPortada = () => {
    setVista('portada');
    setError('');
  };

  return (
    <div className="relative min-h-screen max-w-md mx-auto overflow-hidden">
      {/* Foto del local con velo oscuro, como en la referencia */}
      <img
        src={fondoLocal}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover animate-acercar-foto"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-negro/85 via-negro/45 to-negro" />

      <div className="relative min-h-screen flex flex-col items-center px-7 pt-14 pb-10">
        <img
          src={logo}
          alt="Barbería 9 ¾"
          className="w-[150px] h-[150px] rounded-full object-cover shadow-sello animate-sello"
        />

        <div className="mt-7 text-center animate-aparecer">
          <p className="font-display text-[26px] tracking-[0.12em] leading-none">BARBERÍA</p>
          <div className="flex items-center justify-center gap-3 my-2.5">
            <span className="h-px w-9 bg-dorado/70" />
            <span className="font-display text-[34px] leading-none">9 ¾</span>
            <span className="h-px w-9 bg-dorado/70" />
          </div>
          <p className="text-[10px] tracking-[0.34em] text-crema/55 mt-3">
            CORTE · ESTILO · ACTITUD
          </p>
        </div>

        <div className="flex-1" />

        {vista === 'portada' ? (
          <div className="w-full flex flex-col gap-3 animate-aparecer">
            <button onClick={() => setVista('ingresar')} className="btn-dorado">
              INICIAR SESIÓN
            </button>
            <button onClick={() => setVista('registrar')} className="btn-outline">
              REGISTRARSE
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="w-full animate-aparecer">
            <div className="flex items-center gap-2 mb-4">
              <button
                type="button"
                onClick={volverAPortada}
                aria-label="Volver"
                className="p-2 -m-2 text-crema/70 hover:text-dorado transition-colors duration-200"
              >
                <Icono nombre="atras" size={18} />
              </button>
              <p className="rotulo">
                {vista === 'ingresar' ? 'Iniciar sesión' : 'Crear cuenta'}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {vista === 'registrar' && (
                <input
                  name="nombre"
                  required
                  placeholder="Nombre y apellido"
                  autoComplete="name"
                  className="input-dorado"
                  value={form.nombre}
                  onChange={onChange}
                />
              )}
              <input
                name="email"
                type="email"
                required
                placeholder="Email"
                autoComplete="email"
                className="input-dorado"
                value={form.email}
                onChange={onChange}
              />
              {vista === 'registrar' && (
                <input
                  name="telefono"
                  placeholder="Teléfono (WhatsApp)"
                  autoComplete="tel"
                  className="input-dorado"
                  value={form.telefono}
                  onChange={onChange}
                />
              )}
              <input
                name="password"
                type="password"
                required
                placeholder="Contraseña"
                autoComplete={vista === 'ingresar' ? 'current-password' : 'new-password'}
                className="input-dorado"
                value={form.password}
                onChange={onChange}
              />

              {error && (
                <p className="text-red-400 text-sm flex items-center gap-2 animate-temblor" role="alert">
                  <Icono nombre="cerrar" size={14} />
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={cargando}
                className="btn-dorado flex items-center justify-center gap-2 mt-1"
              >
                {cargando ? (
                  <>
                    <Spinner size={16} className="text-negro" />
                    {vista === 'ingresar' ? 'Ingresando…' : 'Creando cuenta…'}
                  </>
                ) : vista === 'ingresar' ? (
                  'INICIAR SESIÓN'
                ) : (
                  'REGISTRARME'
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setVista(vista === 'ingresar' ? 'registrar' : 'ingresar');
                  setError('');
                }}
                className="text-dorado text-sm py-1 hover:text-dorado-claro transition-colors duration-200"
              >
                {vista === 'ingresar' ? 'No tengo cuenta, registrarme' : 'Ya tengo cuenta, ingresar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
