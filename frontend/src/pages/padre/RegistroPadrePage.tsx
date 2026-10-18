import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registrarPadre } from '../../services/padreService';
import { mensajeDeError } from '../../services/apiErrors';

export function RegistroPadrePage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [declaroSerTutor, setDeclaroSerTutor] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmacion) {
      setError('Las contraseñas no coinciden. Escríbela igual en los dos campos.');
      return;
    }
    setEnviando(true);
    try {
      await registrarPadre(email, password, declaroSerTutor);
      void navigate('/padres/hijos');
    } catch (err) {
      setError(mensajeDeError(err, 'No pudimos crear la cuenta. Revisa la conexión y vuelve a intentarlo.'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="pagina pagina--estrecha">
      <div className="panel">
        <h1>Crear cuenta</h1>
        <p className="texto-secundario">Para padres, madres y tutores. Después agregas los perfiles de tus hijos.</p>
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
              autoComplete="new-password"
              minLength={8}
              aria-describedby="ayuda-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span id="ayuda-password" className="texto-secundario">
              Al menos 8 caracteres.
            </span>
          </div>
          <div className="campo">
            <label htmlFor="confirmacion">Repite la contraseña</label>
            <input
              id="confirmacion"
              type="password"
              autoComplete="new-password"
              value={confirmacion}
              onChange={(e) => setConfirmacion(e.target.value)}
              required
            />
          </div>
          <label className="casilla">
            <input
              type="checkbox"
              checked={declaroSerTutor}
              onChange={(e) => setDeclaroSerTutor(e.target.checked)}
              required
            />
            <span>Declaro que soy mayor de edad y padre, madre o tutor legal de los niños que voy a registrar.</span>
          </label>
          <button type="submit" className="boton boton--ancho" disabled={enviando}>
            {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>
        {error && (
          <p role="alert" className="alerta separado-arriba">
            {error}
          </p>
        )}
      </div>
      <p className="centrado separado-arriba">
        ¿Ya tienes cuenta? <Link to="/padres/login">Ingresa</Link>
      </p>
    </main>
  );
}
