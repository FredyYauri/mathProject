// Un punto por pregunta: verdes las hechas, azul la actual. Las preguntas de
// una lección son una secuencia, por eso se muestran en orden.
export function PuntosProgreso({ actual, total }: { actual: number; total: number }) {
  return (
    <>
      <p className="solo-lectores">
        Pregunta {actual + 1} de {total}
      </p>
      <ol className="puntos-progreso" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <li key={i} className={i < actual ? 'hecho' : i === actual ? 'actual' : undefined} />
        ))}
      </ol>
    </>
  );
}
