import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginPadre } from '../../services/padreService';

export function LoginPadrePage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await loginPadre(email, password);
      void navigate('/padres/hijos');
    } catch {
      setError('El correo o la contraseña no son correctos.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="pagina pagina--estrecha">
      <div className="panel">
        <h1>Ingresar</h1>
        <form onSubmit={(e) => void onSubmit(e)}>
          <div className="campo">
            <label htmlFor="email">Correo</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="campo">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="boton boton--ancho" disabled={enviando}>
            {enviando ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
        {error && (
          <p role="alert" className="alerta separado-arriba">
            {error}
          </p>
        )}
      </div>
      <p className="centrado separado-arriba">
        ¿Primera vez? <Link to="/padres/registro">Crea tu cuenta</Link>
      </p>
    </main>
  );
}
