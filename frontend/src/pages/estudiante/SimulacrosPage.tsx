import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listarSimulacros } from '../../services/simulacroService';
import type { SimulacroResumen } from '../../types/simulacro';

export function SimulacrosPage() {
  const [simulacros, setSimulacros] = useState<SimulacroResumen[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    listarSimulacros()
      .then((data) => activo && setSimulacros(data))
      .catch(() => activo && setError('No pudimos cargar los simulacros. Revisa la conexión y vuelve a intentarlo.'));
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
  if (!simulacros) return <p className="estado-carga">Cargando simulacros…</p>;

  return (
    <main className="pagina">
      <header className="cabecera-juego">
        <Link to="/" className="enlace-salida">
          ← Mapa
        </Link>
      </header>
      <h1>📝 Simulacros</h1>
      <p>Responde preguntas de los temas que ya aprendiste antes de que se acabe el tiempo.</p>

      {simulacros.length === 0 && <p>Todavía no hay simulacros. ¡Vuelve pronto!</p>}
      <ul className="lista-simulacros">
        {simulacros.map((s) => (
          <li key={s.id} className={`simulacro-item${s.disponible ? '' : ' simulacro-item--bloqueado'}`}>
            <div>
              <h2>
                {s.disponible ? '' : '🔒 '}
                {s.nombre}
              </h2>
              <p>
                {s.disponible
                  ? s.ultimoResultado
                    ? `La última vez sacaste ${s.ultimoResultado.puntajePorcentaje}%.`
                    : 'Todavía no lo hiciste.'
                  : 'Se abre cuando completes un nivel de estos temas.'}
              </p>
            </div>
            {s.disponible && (
              <Link to={`/simulacros/${s.id}`} className="boton">
                Hacer simulacro
              </Link>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
