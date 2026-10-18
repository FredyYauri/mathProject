import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { obtenerMapa } from '../../services/progresoService';
import type { MapaAprendizaje, NivelEnMapa } from '../../types/progreso';
import { usePerfilEstudiante } from '../../components/estudiante/usePerfilEstudiante';
import { Estrellas } from '../../components/estudiante/Estrellas';

// Lección a la que lleva el nivel: la primera sin completar, o la primera si
// ya están todas (para volver a jugar).
function leccionDeEntrada(nivel: NivelEnMapa): string | undefined {
  return (nivel.lecciones.find((l) => !l.completada) ?? nivel.lecciones[0])?.id;
}

const DESCRIPCION_ESTADO = {
  completado: 'completado',
  disponible: 'disponible',
  bloqueado: 'bloqueado',
} as const;

function Paso({ nivel, numero, esActual }: { nivel: NivelEnMapa; numero: number; esActual: boolean }) {
  const leccionId = leccionDeEntrada(nivel);
  const bloqueado = nivel.estado === 'bloqueado' || !leccionId;
  const clases = `ficha ficha--${bloqueado ? 'bloqueado' : nivel.estado}${esActual ? ' ficha--actual' : ''}`;
  const etiquetaAccesible = `Nivel ${numero}: ${nivel.nombre}, ${DESCRIPCION_ESTADO[nivel.estado]}`;

  return (
    <li className="paso">
      {bloqueado ? (
        <span className={clases} role="img" aria-label={etiquetaAccesible}>
          🔒
        </span>
      ) : (
        <Link to={`/lecciones/${leccionId}`} className={clases} aria-label={etiquetaAccesible}>
          {nivel.estado === 'completado' ? '✓' : numero}
        </Link>
      )}
      <span className="paso-etiqueta" aria-hidden="true">
        {nivel.nombre}
        {nivel.estado === 'completado' && <Estrellas cantidad={nivel.estrellas} />}
        {esActual && <small>¡Te toca!</small>}
      </span>
    </li>
  );
}

export function MapaAprendizajePage() {
  const perfil = usePerfilEstudiante();
  const [mapa, setMapa] = useState<MapaAprendizaje | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    obtenerMapa()
      .then((data) => activo && setMapa(data))
      .catch(() => activo && setError('No pudimos cargar el mapa. Revisa la conexión y vuelve a intentarlo.'));
    return () => {
      activo = false;
    };
  }, []);

  if (error) {
    return (
      <main className="pagina">
        <p role="alert" className="alerta">
          {error}
        </p>
      </main>
    );
  }
  if (!mapa) return <p className="estado-carga">Cargando tu mapa…</p>;

  // Numeración continua del recorrido y el nivel que toca jugar: el primero
  // disponible que todavía no se completó.
  const todos = mapa.cursos.flatMap((c) => c.unidades.flatMap((u) => u.niveles));
  const numeroDe = new Map(todos.map((n, i) => [n.id, i + 1]));
  const actualId = todos.find((n) => n.estado === 'disponible')?.id;

  return (
    <main className="pagina">
      <header className="barra-nino">
        <h1>¡Hola, {perfil.nombre}!</h1>
        <ul className="contadores">
          <li className="contador">
            <strong>{mapa.totalEstrellas}</strong> <span>⭐ estrellas</span>
          </li>
          <li className="contador">
            <strong>{mapa.totalPuntos}</strong> <span>🏅 puntos</span>
          </li>
        </ul>
      </header>

      <section className="acceso-simulacros" aria-label="Simulacros">
        <p>¿Listo para un desafío contra el reloj?</p>
        <Link to="/simulacros" className="boton boton--secundario">
          📝 Simulacros
        </Link>
      </section>

      {mapa.cursos.length === 0 && <p>Todavía no hay niveles para jugar. ¡Vuelve pronto!</p>}

      {mapa.cursos.map((curso) =>
        curso.unidades.map((unidad) => (
          <section key={unidad.id} className="unidad" aria-labelledby={`unidad-${unidad.id}`}>
            <h2 id={`unidad-${unidad.id}`}>{unidad.nombre}</h2>
            <ol className="camino">
              {unidad.niveles.map((nivel) => (
                <Paso
                  key={nivel.id}
                  nivel={nivel}
                  numero={numeroDe.get(nivel.id) ?? 0}
                  esActual={nivel.id === actualId}
                />
              ))}
            </ol>
          </section>
        )),
      )}
    </main>
  );
}
