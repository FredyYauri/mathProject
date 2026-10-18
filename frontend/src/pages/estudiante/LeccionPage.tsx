import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { obtenerLeccion } from '../../services/contenidoService';
import { completarLeccion, iniciarLeccion, registrarRespuesta } from '../../services/progresoService';
import type { Leccion } from '../../types/contenido';
import type { ResultadoLeccion, ResultadoRespuesta } from '../../types/progreso';
import { Estrellas } from '../../components/estudiante/Estrellas';
import { PuntosProgreso } from '../../components/estudiante/PuntosProgreso';
import { ContenidoOpcion } from '../../components/estudiante/ContenidoOpcion';

function ResultadoFinal({ resultado }: { resultado: ResultadoLeccion }) {
  return (
    <main className="pagina resultado">
      <h1>¡Lección completada! 🎉</h1>
      <Estrellas cantidad={resultado.nivel.estrellas} grande />
      <dl className="datos">
        <div>
          <dt>A la primera</dt>
          <dd>
            {resultado.aciertos} de {resultado.total}
          </dd>
        </div>
        <div>
          <dt>Puntos ganados</dt>
          <dd>+{resultado.puntosGanados}</dd>
        </div>
      </dl>
      {resultado.nivelDesbloqueado && (
        <p className="aviso-desbloqueo">🔓 ¡Abriste el nivel «{resultado.nivelDesbloqueado.nombre}»!</p>
      )}
      <div className="acciones">
        <Link to="/" className="boton">
          Volver al mapa
        </Link>
      </div>
    </main>
  );
}

export function LeccionPage() {
  const { leccionId } = useParams<{ leccionId: string }>();
  const [leccion, setLeccion] = useState<Leccion | null>(null);
  const [sesionId, setSesionId] = useState<string | null>(null);
  const [indice, setIndice] = useState(0);
  const [resultado, setResultado] = useState<ResultadoRespuesta | null>(null);
  // Opción correcta revelada al agotar los intentos: queda resaltada y es la
  // única que se puede marcar para continuar.
  const [opcionRevelada, setOpcionRevelada] = useState<string | null>(null);
  // La última opción que tocó el niño, para marcarla en verde o naranja.
  const [opcionElegida, setOpcionElegida] = useState<string | null>(null);
  const [resultadoFinal, setResultadoFinal] = useState<ResultadoLeccion | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cada entrada a la lección abre una sesión nueva: si el niño sale a la mitad,
  // esa sesión queda sin cerrar y la próxima vez empieza desde el principio.
  useEffect(() => {
    if (!leccionId) return;
    let activo = true;
    Promise.all([obtenerLeccion(leccionId), iniciarLeccion(leccionId)])
      .then(([data, sesion]) => {
        if (!activo) return;
        setLeccion(data);
        setSesionId(sesion.sesionId);
      })
      .catch((err: unknown) => {
        if (!activo) return;
        setError(
          isAxiosError(err) && err.response?.status === 403
            ? 'Este nivel todavía está cerrado. ¡Completa el anterior para abrirlo!'
            : 'No pudimos cargar la lección. Revisa la conexión y vuelve a intentarlo.',
        );
      });
    return () => {
      activo = false;
    };
  }, [leccionId]);

  if (error) {
    return (
      <main className="pagina centrado">
        <p role="alert" className="alerta">
          {error}
        </p>
        <Link to="/" className="boton">
          Volver al mapa
        </Link>
      </main>
    );
  }
  if (!leccion || !sesionId) return <p className="estado-carga">Preparando la lección…</p>;
  if (resultadoFinal) return <ResultadoFinal resultado={resultadoFinal} />;

  const pregunta = leccion.preguntas[indice];
  const total = leccion.preguntas.length;
  const esUltima = indice === total - 1;

  if (!pregunta) {
    return (
      <main className="pagina centrado">
        <p>Esta lección todavía no tiene preguntas.</p>
        <Link to="/" className="boton">
          Volver al mapa
        </Link>
      </main>
    );
  }

  async function responder(opcionId: string) {
    if (!pregunta || !sesionId) return;
    setEnviando(true);
    setOpcionElegida(opcionId);
    try {
      const data = await registrarRespuesta({
        sesionLeccionId: sesionId,
        preguntaId: pregunta.id,
        opcionSeleccionadaId: opcionId,
      });
      setResultado(data);
      if (data.opcionCorrectaId) setOpcionRevelada(data.opcionCorrectaId);
    } catch {
      setError('No pudimos revisar tu respuesta. Revisa la conexión y vuelve a intentarlo.');
    } finally {
      setEnviando(false);
    }
  }

  async function siguiente() {
    if (!esUltima) {
      setResultado(null);
      setOpcionRevelada(null);
      setOpcionElegida(null);
      setIndice((i) => i + 1);
      return;
    }
    if (!sesionId) return;
    setEnviando(true);
    try {
      setResultadoFinal(await completarLeccion(sesionId));
    } catch {
      setError('No pudimos guardar tu resultado. Revisa la conexión y vuelve a intentarlo.');
    } finally {
      setEnviando(false);
    }
  }

  function reintentar() {
    setResultado(null);
    setOpcionElegida(null);
  }

  function claseOpcion(opcionId: string): string {
    if (opcionId === opcionRevelada && !(resultado?.esCorrecta && opcionId === opcionElegida)) {
      return 'opcion opcion--revelada';
    }
    if (resultado && opcionId === opcionElegida) {
      return `opcion ${resultado.esCorrecta ? 'opcion--acierto' : 'opcion--fallo'}`;
    }
    return 'opcion';
  }

  // Tras un error se puede volver a elegir: con intentos, cualquier opción; con
  // la respuesta revelada, solo la correcta.
  const puedeElegir = (opcionId: string) =>
    !enviando &&
    (resultado === null || (!resultado.esCorrecta && opcionRevelada !== null)) &&
    (opcionRevelada === null || opcionId === opcionRevelada);

  return (
    <main className="pagina">
      <header className="cabecera-juego">
        <Link to="/" className="enlace-salida">
          ✕ Salir
        </Link>
        <PuntosProgreso actual={indice} total={total} />
      </header>

      <h1 className="enunciado">{pregunta.enunciado}</h1>
      {pregunta.imagenUrl && <img className="imagen-pregunta" src={pregunta.imagenUrl} alt="" />}

      <ul className="opciones">
        {pregunta.opciones.map((opcion) => (
          <li key={opcion.id}>
            <button
              type="button"
              className={claseOpcion(opcion.id)}
              onClick={() => void responder(opcion.id)}
              disabled={!puedeElegir(opcion.id)}
              aria-describedby={opcion.id === opcionRevelada ? 'ayuda-respuesta-correcta' : undefined}
            >
              <ContenidoOpcion opcion={opcion} />
            </button>
          </li>
        ))}
      </ul>

      {resultado && (
        <div
          role="status"
          className={`panel-respuesta panel-respuesta--${resultado.esCorrecta ? 'bien' : 'casi'}`}
        >
          {resultado.esCorrecta ? (
            <>
              <p className="mensaje">🎉 ¡Muy bien!</p>
              {resultado.explicacion && <p className="detalle">{resultado.explicacion}</p>}
              <button
                type="button"
                className="boton boton--exito boton--ancho"
                onClick={() => void siguiente()}
                disabled={enviando}
              >
                {esUltima ? 'Terminar' : 'Continuar'}
              </button>
            </>
          ) : opcionRevelada ? (
            <>
              <p className="mensaje" id="ayuda-respuesta-correcta">
                ¡No pasa nada, así se aprende!
              </p>
              <p className="detalle">
                La respuesta correcta está marcada con un círculo verde. Tócala para continuar.
                {resultado.explicacion && <> {resultado.explicacion}</>}
              </p>
            </>
          ) : (
            <>
              <p className="mensaje">Casi…</p>
              <p className="detalle">
                {resultado.pista ?? '¡Inténtalo otra vez!'}{' '}
                {resultado.intentosRestantes === 1
                  ? 'Te queda 1 intento.'
                  : `Te quedan ${resultado.intentosRestantes} intentos.`}
              </p>
              <button type="button" className="boton boton--ancho" onClick={reintentar}>
                Intentar de nuevo
              </button>
            </>
          )}
        </div>
      )}
    </main>
  );
}
