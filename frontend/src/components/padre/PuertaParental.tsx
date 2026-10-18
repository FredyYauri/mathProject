import { useState, type ReactNode } from 'react';
import { abrirPuertaParental, puertaParentalAbierta } from './puertaParentalStorage';

function generarDesafio() {
  const a = 4 + Math.floor(Math.random() * 5); // 4-8
  const b = 6 + Math.floor(Math.random() * 4); // 6-9
  return { a, b, resultado: a * b };
}

/**
 * Mecanismo para evitar que un niño acceda accidentalmente a la sección de
 * padres (spec.md §3, "separación niño/padre"; CLAUDE.md, consideraciones no
 * negociables). No es un mecanismo de seguridad real — la autenticación real
 * del padre/tutor ocurre después, en el login. Esto solo filtra el acceso
 * casual/accidental de un niño de la franja 6-8 años.
 */
export function PuertaParental({ children }: { children: ReactNode }) {
  const [desbloqueada, setDesbloqueada] = useState(puertaParentalAbierta);
  const [desafio, setDesafio] = useState(generarDesafio);
  const [respuesta, setRespuesta] = useState('');
  const [error, setError] = useState(false);

  if (desbloqueada) return <>{children}</>;

  function verificar(e: React.FormEvent) {
    e.preventDefault();
    if (Number(respuesta) === desafio.resultado) {
      abrirPuertaParental();
      setDesbloqueada(true);
    } else {
      setError(true);
      setDesafio(generarDesafio());
      setRespuesta('');
    }
  }

  return (
    <main className="pagina pagina--estrecha">
      <div role="dialog" aria-labelledby="puerta-parental-titulo" className="panel">
        <h1 id="puerta-parental-titulo">Área de padres y tutores</h1>
        <p>Para entrar, resuelve esta operación.</p>
        <form onSubmit={verificar}>
          <div className="campo">
            <label htmlFor="respuesta-desafio">
              ¿Cuánto es {desafio.a} × {desafio.b}?
            </label>
            <input
              id="respuesta-desafio"
              type="number"
              inputMode="numeric"
              value={respuesta}
              onChange={(e) => setRespuesta(e.target.value)}
              autoFocus
              required
            />
          </div>
          <button type="submit" className="boton boton--ancho">
            Entrar
          </button>
        </form>
        {error && (
          <p role="alert" className="alerta separado-arriba">
            Ese resultado no es correcto. Prueba con la nueva operación.
          </p>
        )}
      </div>
      <p className="centrado separado-arriba">
        <a href="/">Volver a la app</a>
      </p>
    </main>
  );
}
