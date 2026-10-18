import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { obtenerProgresoHijo } from '../../services/padreService';
import type { EstadoTema, ProgresoHijoDetalle, SimulacroResultadoResumen, TemaHijo } from '../../types/padre';
import type { EstadoNivel } from '../../types/progreso';

const ETIQUETA_TEMA: Record<EstadoTema, string> = {
  dominado: 'Dominado',
  en_progreso: 'En progreso',
  reforzar: 'A reforzar',
  sin_datos: 'Sin datos aún',
};

const ETIQUETA_NIVEL: Record<EstadoNivel, string> = {
  completado: 'Completado',
  disponible: 'Disponible',
  bloqueado: 'Bloqueado',
};

// Orden de lectura para el padre: primero lo que necesita atención.
const ORDEN_TEMA: EstadoTema[] = ['reforzar', 'en_progreso', 'dominado', 'sin_datos'];

function formatearTiempo(segundos: number): string {
  return `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`;
}

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
}

function plural(n: number, singular: string, varios: string): string {
  return `${n} ${n === 1 ? singular : varios}`;
}

// Una frase en vez de una tabla de siete columnas: se lee igual en el teléfono.
function describirSimulacro(s: SimulacroResultadoResumen): string {
  const partes = [plural(s.correctas, 'correcta', 'correctas'), plural(s.incorrectas, 'incorrecta', 'incorrectas')];
  if (s.sinResponder > 0) partes.push(plural(s.sinResponder, 'sin responder', 'sin responder'));
  const respuestas = `${partes.slice(0, -1).join(', ')} y ${partes.at(-1)}`;
  const reforzar = s.temasAReforzar.length > 0 ? ` A reforzar: ${s.temasAReforzar.join(', ')}.` : ' Sin temas a reforzar.';
  return `${respuestas} en ${formatearTiempo(s.tiempoUtilizadoSegundos)}.${reforzar}`;
}

function Tema({ tema }: { tema: TemaHijo }) {
  return (
    <li className={`tema tema--${tema.estado}`}>
      <strong>{tema.nombre}</strong>
      <span>
        {tema.porcentajeAcierto !== null && (
          <span className="texto-secundario">{tema.porcentajeAcierto}% de acierto a la primera </span>
        )}
        <span className={`etiqueta etiqueta--${tema.estado}`}>{ETIQUETA_TEMA[tema.estado]}</span>
      </span>
    </li>
  );
}

export function ProgresoHijoPage() {
  const { estudianteId } = useParams<{ estudianteId: string }>();
  const [detalle, setDetalle] = useState<ProgresoHijoDetalle | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!estudianteId) return;
    let activo = true;
    obtenerProgresoHijo(estudianteId)
      .then((data) => activo && setDetalle(data))
      .catch(() => activo && setError('No pudimos cargar el progreso. Revisa la conexión y vuelve a intentarlo.'));
    return () => {
      activo = false;
    };
  }, [estudianteId]);

  if (error) {
    return (
      <main className="pagina">
        <p role="alert" className="alerta">
          {error}
        </p>
      </main>
    );
  }
  if (!detalle) return <p className="estado-carga">Cargando progreso…</p>;

  const { resumen, unidades, simulacros } = detalle;
  const temasOrdenados = [...unidades].sort((a, b) => ORDEN_TEMA.indexOf(a.estado) - ORDEN_TEMA.indexOf(b.estado));

  return (
    <main className="pagina">
      <p>
        <Link to="/padres/hijos">← Mis hijos</Link>
      </p>
      <h1>Progreso de {detalle.nombre}</h1>

      <dl className="resumen">
        <div>
          <dt>Niveles</dt>
          <dd>
            {resumen.nivelesCompletados} de {resumen.nivelesTotales}
          </dd>
        </div>
        <div>
          <dt>Estrellas</dt>
          <dd>{resumen.totalEstrellas}</dd>
        </div>
        <div>
          <dt>Puntos</dt>
          <dd>{resumen.totalPuntos}</dd>
        </div>
      </dl>

      <section className="seccion" aria-labelledby="titulo-temas">
        <h2 id="titulo-temas">Temas</h2>
        <ul className="temas">
          {temasOrdenados.map((t) => (
            <Tema key={t.id} tema={t} />
          ))}
        </ul>
        <p className="texto-secundario">
          Un tema está dominado cuando tiene al menos 70% de respuestas correctas a la primera y todos sus niveles
          completados. Con menos de 70%, conviene reforzarlo.
        </p>
      </section>

      <section className="seccion" aria-labelledby="titulo-niveles">
        <h2 id="titulo-niveles">Niveles</h2>
        {unidades.map((u) => (
          <div key={u.id}>
            <h3>{u.nombre}</h3>
            <ul className="niveles-padre">
              {u.niveles.map((n) => (
                <li key={n.id}>
                  <span>{n.nombre}</span>
                  <span className="texto-secundario">
                    {n.estado === 'completado'
                      ? `${n.estrellas} ${n.estrellas === 1 ? 'estrella' : 'estrellas'}`
                      : ETIQUETA_NIVEL[n.estado]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="seccion" aria-labelledby="titulo-simulacros">
        <h2 id="titulo-simulacros">Últimos simulacros</h2>
        {simulacros.length === 0 ? (
          <p>Todavía no hizo ningún simulacro.</p>
        ) : (
          <ul className="resultados-simulacro">
            {simulacros.map((s) => (
              <li key={s.id}>
                <p className="puntaje">{s.puntajePorcentaje}%</p>
                <div>
                  <p>
                    <strong>{s.nombre}</strong>
                    <br />
                    <span className="texto-secundario">{formatearFecha(s.creadoEn)}</span>
                  </p>
                  <p>{describirSimulacro(s)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
