import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  finalizarSimulacro,
  iniciarSimulacro,
  listarSimulacros,
  responderSimulacro,
} from '../../services/simulacroService';
import type { ResultadoSimulacro, SesionSimulacro, SimulacroResumen } from '../../types/simulacro';
import { PuntosProgreso } from '../../components/estudiante/PuntosProgreso';
import { ContenidoOpcion } from '../../components/estudiante/ContenidoOpcion';

// El reloj se pone naranja (nunca rojo) cuando queda poco.
const SEGUNDOS_POCO_TIEMPO = 30;

function formatearTiempo(segundos: number): string {
  const s = Math.max(0, segundos);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function Resultado({ resultado }: { resultado: ResultadoSimulacro }) {
  return (
    <main className="pagina resultado">
      <h1>¡Terminaste el simulacro! 🎉</h1>
      <p className="cifra-grande">{resultado.puntajePorcentaje}%</p>
      <dl className="datos">
        <div>
          <dt>Correctas</dt>
          <dd>{resultado.correctas}</dd>
        </div>
        <div>
          <dt>Incorrectas</dt>
          <dd>{resultado.incorrectas}</dd>
        </div>
        {resultado.sinResponder > 0 && (
          <div>
            <dt>Sin responder</dt>
            <dd>{resultado.sinResponder}</dd>
          </div>
        )}
        <div>
          <dt>Tiempo</dt>
          <dd>{formatearTiempo(resultado.tiempoUtilizadoSegundos)}</dd>
        </div>
        <div>
          <dt>Puntos ganados</dt>
          <dd>+{resultado.puntos}</dd>
        </div>
      </dl>
      {resultado.temasAReforzar.length > 0 ? (
        <>
          <h2>Para practicar un poco más</h2>
          <ul className="lista-temas">
            {resultado.temasAReforzar.map((t) => (
              <li key={t.id}>{t.nombre}</li>
            ))}
          </ul>
        </>
      ) : (
        <p>¡Dominas todos los temas de este simulacro! 🌟</p>
      )}
      <div className="acciones">
        <Link to="/" className="boton">
          Volver al mapa
        </Link>
      </div>
    </main>
  );
}

export function SimulacroPage() {
  const { simulacroId } = useParams<{ simulacroId: string }>();
  const [info, setInfo] = useState<SimulacroResumen | null>(null);
  const [sesion, setSesion] = useState<SesionSimulacro | null>(null);
  const [indice, setIndice] = useState(0);
  const [segundosRestantes, setSegundosRestantes] = useState(0);
  const [resultado, setResultado] = useState<ResultadoSimulacro | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Evita cerrar dos veces si el contador llega a 0 justo al responder la última.
  const finalizando = useRef(false);

  useEffect(() => {
    let activo = true;
    listarSimulacros()
      .then((lista) => {
        if (!activo) return;
        const encontrado = lista.find((s) => s.id === simulacroId);
        if (encontrado?.disponible) setInfo(encontrado);
        else setError('Este simulacro se abre cuando completes un nivel de sus temas.');
      })
      .catch(() => activo && setError('No pudimos cargar el simulacro. Revisa la conexión y vuelve a intentarlo.'));
    return () => {
      activo = false;
    };
  }, [simulacroId]);

  const finalizar = useCallback(async (sesionId: string) => {
    if (finalizando.current) return;
    finalizando.current = true;
    try {
      setResultado(await finalizarSimulacro(sesionId));
    } catch {
      setError('No pudimos guardar tu resultado. Revisa la conexión y vuelve a intentarlo.');
    }
  }, []);

  // Cuenta regresiva local con la duración que da el servidor. El servidor es
  // quien hace cumplir el límite; esto solo lo muestra y cierra a tiempo.
  useEffect(() => {
    if (!sesion || resultado) return;
    const limite = Date.now() + sesion.segundosRestantes * 1000;
    const timer = setInterval(() => {
      const restantes = Math.ceil((limite - Date.now()) / 1000);
      setSegundosRestantes(restantes);
      if (restantes <= 0) {
        clearInterval(timer);
        void finalizar(sesion.sesionId);
      }
    }, 250);
    return () => clearInterval(timer);
  }, [sesion, resultado, finalizar]);

  async function comenzar() {
    if (!simulacroId) return;
    setEnviando(true);
    try {
      const nueva = await iniciarSimulacro(simulacroId);
      setSegundosRestantes(nueva.segundosRestantes);
      setSesion(nueva);
    } catch {
      setError('No pudimos empezar el simulacro. Revisa la conexión y vuelve a intentarlo.');
    } finally {
      setEnviando(false);
    }
  }

  async function responder(preguntaId: string, opcionId: string) {
    if (!sesion) return;
    setEnviando(true);
    try {
      await responderSimulacro(sesion.sesionId, preguntaId, opcionId);
      if (indice + 1 < sesion.preguntas.length) setIndice(indice + 1);
      else await finalizar(sesion.sesionId);
    } catch {
      // Lo más probable es que se haya acabado el tiempo: cerrar con lo respondido.
      await finalizar(sesion.sesionId);
    } finally {
      setEnviando(false);
    }
  }

  if (error) {
    return (
      <main className="pagina centrado">
        <p role="alert" className="alerta">
          {error}
        </p>
        <Link to="/simulacros" className="boton">
          Volver a simulacros
        </Link>
      </main>
    );
  }
  if (resultado) return <Resultado resultado={resultado} />;
  if (!info) return <p className="estado-carga">Cargando simulacro…</p>;

  if (!sesion) {
    const minutos = Math.round(info.duracionSegundos / 60);
    return (
      <main className="pagina resultado">
        <header className="cabecera-juego">
          <Link to="/simulacros" className="enlace-salida">
            ← Simulacros
          </Link>
        </header>
        <h1>{info.nombre}</h1>
        <dl className="datos">
          <div>
            <dt>Preguntas</dt>
            <dd>{info.numeroPreguntas}</dd>
          </div>
          <div>
            <dt>Tiempo</dt>
            <dd>{minutos === 1 ? '1 minuto' : `${minutos} minutos`}</dd>
          </div>
        </dl>
        <p>Cada pregunta se responde una sola vez. Al final verás cómo te fue.</p>
        <div className="acciones">
          <button type="button" className="boton" onClick={() => void comenzar()} disabled={enviando}>
            ¡Comenzar!
          </button>
        </div>
      </main>
    );
  }

  const pregunta = sesion.preguntas[indice];
  if (!pregunta) return <p className="estado-carga">Calculando tu resultado…</p>;

  return (
    <main className="pagina">
      <header className="cabecera-juego">
        <Link to="/simulacros" className="enlace-salida">
          ✕ Salir
        </Link>
        <PuntosProgreso actual={indice} total={sesion.preguntas.length} />
        <span
          className={`reloj${segundosRestantes <= SEGUNDOS_POCO_TIEMPO ? ' reloj--poco-tiempo' : ''}`}
          role="timer"
          aria-label={`Quedan ${formatearTiempo(segundosRestantes)}`}
        >
          ⏱️ {formatearTiempo(segundosRestantes)}
        </span>
      </header>

      <h1 className="enunciado">{pregunta.enunciado}</h1>
      {pregunta.imagenUrl && <img className="imagen-pregunta" src={pregunta.imagenUrl} alt="" />}

      <ul className="opciones">
        {pregunta.opciones.map((opcion) => (
          <li key={opcion.id}>
            <button
              type="button"
              className="opcion"
              onClick={() => void responder(pregunta.id, opcion.id)}
              disabled={enviando || segundosRestantes <= 0}
            >
              <ContenidoOpcion opcion={opcion} />
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
