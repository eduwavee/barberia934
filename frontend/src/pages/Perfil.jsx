import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import BottomNav from '../components/BottomNav';
import Encabezado from '../components/Encabezado';
import Pantalla from '../components/Pantalla';
import Icono from '../components/Icono';
import { Spinner } from '../components/Cargando';

export default function Perfil() {
  const { usuario, setUsuario, logout } = useAuth();
  const [datos, setDatos] = useState({ nombre: '', telefono: '' });
  const [claves, setClaves] = useState({ actual: '', nueva: '' });
  const [guardando, setGuardando] = useState(false);
  const [cambiando, setCambiando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [mensajeClave, setMensajeClave] = useState(null);

  useEffect(() => {
    if (usuario) setDatos({ nombre: usuario.nombre ?? '', telefono: usuario.telefono ?? '' });
  }, [usuario]);

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);
    try {
      const { data } = await api.put('/usuarios/perfil', datos);
      setUsuario(data);
      setMensaje({ texto: 'Datos guardados.', exito: true });
    } catch (err) {
      setMensaje({ texto: err.response?.data?.error || 'No se pudo guardar', exito: false });
    } finally {
      setGuardando(false);
    }
  };

  const cambiarClave = async (e) => {
    e.preventDefault();
    setCambiando(true);
    setMensajeClave(null);
    try {
      await api.put('/auth/password', claves);
      setClaves({ actual: '', nueva: '' });
      setMensajeClave({ texto: 'Contraseña actualizada.', exito: true });
    } catch (err) {
      setMensajeClave({
        texto: err.response?.data?.error || 'No se pudo cambiar',
        exito: false,
      });
    } finally {
      setCambiando(false);
    }
  };

  const sinTelefono = !usuario?.telefono;

  return (
    <Pantalla className="max-w-md mx-auto pb-28">
      <Encabezado titulo="Mi cuenta" volverA="/" />

      <div className="px-5 pt-5">
        {/* Sin teléfono no le podemos mandar el recordatorio del turno */}
        {sinTelefono && (
          <div className="card mb-4 border-dorado/45 animate-aparecer">
            <div className="flex items-start gap-3">
              <Icono nombre="whatsapp" size={19} className="text-dorado mt-0.5 shrink-0" />
              <p className="text-[13px] leading-relaxed text-crema/75">
                Cargá tu teléfono para que te podamos recordar el turno por WhatsApp el día
                anterior.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={guardar} className="card animate-aparecer">
          <p className="rotulo-tenue mb-3">Mis datos</p>

          <div className="flex flex-col gap-3">
            <label className="block">
              <span className="text-crema/50 text-[12px]">Nombre</span>
              <input
                className="input-dorado mt-1"
                required
                value={datos.nombre}
                onChange={(e) => setDatos({ ...datos, nombre: e.target.value })}
              />
            </label>

            <label className="block">
              <span className="text-crema/50 text-[12px]">Teléfono (WhatsApp)</span>
              <input
                className="input-dorado mt-1"
                placeholder="381 200 6246"
                autoComplete="tel"
                value={datos.telefono}
                onChange={(e) => setDatos({ ...datos, telefono: e.target.value })}
              />
            </label>

            <p className="text-crema/35 text-[12px]">
              Tu email es {usuario?.email} y no se puede cambiar desde acá.
            </p>

            {mensaje && (
              <p
                role="status"
                className={`text-sm flex items-center gap-2 ${
                  mensaje.exito ? 'text-dorado animate-aparecer' : 'text-red-400 animate-temblor'
                }`}
              >
                <Icono nombre={mensaje.exito ? 'check' : 'cerrar'} size={15} grosor={2} />
                {mensaje.texto}
              </p>
            )}

            <button disabled={guardando} className="btn-dorado flex items-center justify-center gap-2">
              {guardando ? (
                <>
                  <Spinner size={16} className="text-negro" /> Guardando…
                </>
              ) : (
                'GUARDAR'
              )}
            </button>
          </div>
        </form>

        <form onSubmit={cambiarClave} className="card mt-4 animate-aparecer">
          <p className="rotulo-tenue mb-3">Cambiar contraseña</p>

          <div className="flex flex-col gap-3">
            <input
              type="password"
              required
              placeholder="Contraseña actual"
              autoComplete="current-password"
              className="input-dorado"
              value={claves.actual}
              onChange={(e) => setClaves({ ...claves, actual: e.target.value })}
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="Contraseña nueva (mínimo 6)"
              autoComplete="new-password"
              className="input-dorado"
              value={claves.nueva}
              onChange={(e) => setClaves({ ...claves, nueva: e.target.value })}
            />

            {mensajeClave && (
              <p
                role="status"
                className={`text-sm flex items-center gap-2 ${
                  mensajeClave.exito ? 'text-dorado animate-aparecer' : 'text-red-400 animate-temblor'
                }`}
              >
                <Icono nombre={mensajeClave.exito ? 'check' : 'cerrar'} size={15} grosor={2} />
                {mensajeClave.texto}
              </p>
            )}

            <button disabled={cambiando} className="btn-outline">
              {cambiando ? 'Cambiando…' : 'CAMBIAR CONTRASEÑA'}
            </button>
          </div>
        </form>

        <button
          onClick={logout}
          className="group btn-outline w-full mt-4 inline-flex items-center justify-center gap-2"
        >
          <Icono
            nombre="salir"
            size={17}
            className="transition-transform duration-300 group-hover:translate-x-0.5"
          />
          CERRAR SESIÓN
        </button>
      </div>

      <BottomNav />
    </Pantalla>
  );
}
