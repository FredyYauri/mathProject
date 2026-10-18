import { useEffect, useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { obtenerPerfilActivo } from '../../services/estudianteService';
import type { PerfilEstudiante } from '../../types/estudiante';

type EstadoPerfil =
  | { tipo: 'verificando' }
  | { tipo: 'activo'; perfil: PerfilEstudiante }
  | { tipo: 'sin-perfil' }
  | { tipo: 'error' };

// Guard de la experiencia del niño: exige un perfil activo en el dispositivo
// (cookie httpOnly verificada por el backend). Si no hay, el niño no puede
// activarlo solo — tiene que pedírselo a un adulto desde /padres.
export function RutaEstudiante() {
  const [estado, setEstado] = useState<EstadoPerfil>({ tipo: 'verificando' });

  useEffect(() => {
    let activo = true;
    obtenerPerfilActivo()
      .then((perfil) => {
        if (activo) setEstado(perfil ? { tipo: 'activo', perfil } : { tipo: 'sin-perfil' });
      })
      .catch(() => {
        if (activo) setEstado({ tipo: 'error' });
      });
    return () => {
      activo = false;
    };
  }, []);

  if (estado.tipo === 'verificando') return <p className="estado-carga">Cargando…</p>;
  if (estado.tipo === 'error') {
    return (
      <main className="pagina">
        <p role="alert" className="alerta">
          No pudimos conectarnos. Revisa la conexión y vuelve a intentarlo.
        </p>
      </main>
    );
  }

  if (estado.tipo === 'sin-perfil') {
    return (
      <main className="pagina pagina--estrecha resultado">
        <p className="cifra-grande" aria-hidden="true">
          👋
        </p>
        <h1>¡Hola!</h1>
        <p>Pídele a un adulto que active tu perfil en este dispositivo.</p>
        <Link to="/padres/login" className="boton boton--secundario">
          Soy un adulto
        </Link>
      </main>
    );
  }

  return <Outlet context={estado.perfil} />;
}
