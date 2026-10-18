import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  activarPerfilEnDispositivo,
  crearHijo,
  obtenerHijos,
  quitarPerfilDelDispositivo,
} from '../../services/padreService';
import { mensajeDeError } from '../../services/apiErrors';
import { obtenerPerfilActivo } from '../../services/estudianteService';
import { cerrarPuertaParental } from '../../components/padre/puertaParentalStorage';
import type { Hijo } from '../../types/padre';
import type { PerfilEstudiante } from '../../types/estudiante';

export function HijosPage() {
  const navigate = useNavigate();
  const [hijos, setHijos] = useState<Hijo[] | null>(null);
  const [perfilActivo, setPerfilActivo] = useState<PerfilEstudiante | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [agregando, setAgregando] = useState(false);

  useEffect(() => {
    let activo = true;
    obtenerHijos()
      .then((data) => activo && setHijos(data))
      .catch(() => activo && setError('No pudimos cargar tus hijos. Revisa la conexión y vuelve a intentarlo.'));
    obtenerPerfilActivo()
      .then((perfil) => activo && setPerfilActivo(perfil))
      .catch(() => activo && setPerfilActivo(null));
    return () => {
      activo = false;
    };
  }, []);

  // Al activar el perfil, el backend cierra la sesión del padre; aquí se cierra
  // también la puerta parental para que el niño no vuelva a /padres sin un adulto.
  async function usarEnEsteDispositivo(hijo: Hijo) {
    setError(null);
    try {
      await activarPerfilEnDispositivo(hijo.id);
      cerrarPuertaParental();
      void navigate('/', { replace: true });
    } catch {
      setError(`No pudimos activar el perfil de ${hijo.nombre}. Vuelve a intentarlo.`);
    }
  }

  async function agregarHijo(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setAgregando(true);
    try {
      const hijo = await crearHijo(nombreNuevo);
      setHijos((actuales) => [...(actuales ?? []), hijo]);
      setNombreNuevo('');
    } catch (err) {
      setError(mensajeDeError(err, 'No pudimos agregar el perfil. Vuelve a intentarlo.'));
    } finally {
      setAgregando(false);
    }
  }

  async function quitarPerfil() {
    setError(null);
    try {
      await quitarPerfilDelDispositivo();
      setPerfilActivo(null);
    } catch {
      setError('No pudimos quitar el perfil de este dispositivo. Vuelve a intentarlo.');
    }
  }

  if (!hijos && !error) return <p className="estado-carga">Cargando…</p>;

  return (
    <main className="pagina">
      <h1>Mis hijos</h1>

      <div className="nota">
        <p>
          {perfilActivo
            ? `En este dispositivo está activo el perfil de ${perfilActivo.nombre}.`
            : 'En este dispositivo no hay ningún perfil activo.'}
        </p>
        {perfilActivo && (
          <button type="button" className="boton boton--secundario boton--pequeno" onClick={() => void quitarPerfil()}>
            Quitar perfil
          </button>
        )}
      </div>

      {hijos && hijos.length === 0 && <p>Todavía no agregaste ningún perfil. Empieza con el formulario de abajo.</p>}
      {hijos && hijos.length > 0 && (
        <ul className="lista-hijos">
          {hijos.map((hijo) => (
            <li key={hijo.id} className="fila-hijo">
              <Link to={`/padres/hijos/${hijo.id}`}>{hijo.nombre}</Link>
              <button
                type="button"
                className="boton boton--pequeno"
                onClick={() => void usarEnEsteDispositivo(hijo)}
              >
                Usar en este dispositivo
              </button>
            </li>
          ))}
        </ul>
      )}

      <section className="seccion" aria-labelledby="titulo-agregar">
        <h2 id="titulo-agregar">Agregar un hijo</h2>
        <form className="formulario-en-linea" onSubmit={(e) => void agregarHijo(e)}>
          <label htmlFor="nombre-hijo" className="solo-lectores">
            Nombre o apodo
          </label>
          <input
            id="nombre-hijo"
            placeholder="Nombre o apodo"
            aria-describedby="ayuda-nombre-hijo"
            value={nombreNuevo}
            onChange={(e) => setNombreNuevo(e.target.value)}
            maxLength={40}
            required
          />
          <button type="submit" className="boton" disabled={agregando}>
            {agregando ? 'Agregando…' : 'Agregar'}
          </button>
        </form>
        <p id="ayuda-nombre-hijo" className="texto-secundario">
          Solo pedimos un nombre o apodo para mostrarlo en la app. No hace falta el nombre completo ni otros datos.
        </p>
      </section>

      {error && (
        <p role="alert" className="alerta">
          {error}
        </p>
      )}
    </main>
  );
}
