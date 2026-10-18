import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { MapaAprendizajePage } from './pages/estudiante/MapaAprendizajePage';
import { LeccionPage } from './pages/estudiante/LeccionPage';
import { SimulacrosPage } from './pages/estudiante/SimulacrosPage';
import { SimulacroPage } from './pages/estudiante/SimulacroPage';
import { LoginPadrePage } from './pages/padre/LoginPadrePage';
import { RegistroPadrePage } from './pages/padre/RegistroPadrePage';
import { HijosPage } from './pages/padre/HijosPage';
import { ProgresoHijoPage } from './pages/padre/ProgresoHijoPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PuertaParental } from './components/padre/PuertaParental';
import { RutaProtegidaPadre } from './components/padre/RutaProtegidaPadre';
import { RutaEstudiante } from './components/estudiante/RutaEstudiante';

// Dos árboles de rutas deliberadamente separados: "/" es la experiencia del
// niño (exige un perfil activado por el padre en el dispositivo), "/padres"
// queda detrás de la puerta parental + login del tutor
// (spec.md §3, separación niño/padre; CLAUDE.md, consideraciones no negociables).
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RutaEstudiante />}>
          <Route path="/" element={<MapaAprendizajePage />} />
          <Route path="/lecciones/:leccionId" element={<LeccionPage />} />
          <Route path="/simulacros" element={<SimulacrosPage />} />
          <Route path="/simulacros/:simulacroId" element={<SimulacroPage />} />
        </Route>

        <Route
          path="/padres/*"
          element={
            <div className="zona-padre">
            <PuertaParental>
              <Routes>
                <Route path="login" element={<LoginPadrePage />} />
                <Route path="registro" element={<RegistroPadrePage />} />
                <Route element={<RutaProtegidaPadre />}>
                  <Route path="hijos" element={<HijosPage />} />
                  <Route path="hijos/:estudianteId" element={<ProgresoHijoPage />} />
                </Route>
              </Routes>
            </PuertaParental>
            </div>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
