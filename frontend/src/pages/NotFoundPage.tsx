import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="pagina pagina--estrecha resultado">
      <p className="cifra-grande" aria-hidden="true">
        🧭
      </p>
      <h1>Esta página no existe</h1>
      <p>Puede que el enlace esté mal escrito.</p>
      <Link to="/" className="boton">
        Ir al inicio
      </Link>
    </main>
  );
}
