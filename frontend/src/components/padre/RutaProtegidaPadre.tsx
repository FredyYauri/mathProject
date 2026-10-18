import { useEffect, useState } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { haySesionActiva, logoutPadre } from '../../services/padreService';
import { cerrarPuertaParental } from './puertaParentalStorage';

type EstadoSesion = 'verificando' | 'autenticado' | 'no-autenticado';

// Guard de ruta: exige sesión de padre/tutor válida (cookie httpOnly
// verificada por el backend). Nunca decide autenticación solo en el cliente.
export function RutaProtegidaPadre() {
  const navigate = useNavigate();
  const [estado, setEstado] = useState<EstadoSesion>('verificando');

  useEffect(() => {
    let activo = true;
    haySesionActiva()
      .then((ok) => {
        if (activo) setEstado(ok ? 'autenticado' : 'no-autenticado');
      })
      .catch(() => {
        if (activo) setEstado('no-autenticado');
      });
    return () => {
      activo = false;
    };
  }, []);

  // Al salir se cierra también la puerta parental: si el niño toma el
  // dispositivo después, tiene que volver a pasarla.
  async function cerrarSesion() {
    await logoutPadre().catch(() => undefined);
    cerrarPuertaParental();
    void navigate('/', { replace: true });
  }

  if (estado === 'verificando') return <p className="estado-carga">Cargando…</p>;
  if (estado === 'no-autenticado') return <Navigate to="/padres/login" replace />;
  return (
    <>
      <header className="barra-padre">
        <p>Área de padres y tutores</p>
        <button type="button" className="boton boton--secundario boton--pequeno" onClick={() => void cerrarSesion()}>
          Cerrar sesión
        </button>
      </header>
      <Outlet />
    </>
  );
}
