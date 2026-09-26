import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth } from './auth/RequireAuth.jsx';
import { useAuth } from './auth/AuthContext.jsx';
import { ROLES } from './auth/roles.js';
import { AppShell } from './components/layout/AppShell.jsx';
import { EmptyState } from './components/ui/componentes.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SolicitudesPage from './pages/SolicitudesPage.jsx';
import NuevaSolicitudPage from './pages/NuevaSolicitudPage.jsx';
import SolicitudDetallePage from './pages/SolicitudDetallePage.jsx';
import IndicadoresPage from './pages/IndicadoresPage.jsx';
import AuditoriaPage from './pages/AuditoriaPage.jsx';
import ExportacionPage from './pages/ExportacionPage.jsx';

const { SOLICITANTE, AGENTE, COORDINADOR, AUDITOR } = ROLES;

// La página de inicio depende del rol: el auditor entra directo a su historial.
function Inicio() {
  const { usuario } = useAuth();
  return <Navigate to={usuario.rol === AUDITOR ? '/auditoria' : '/solicitudes'} replace />;
}

// Página simple para rutas que no existen.
function NoEncontrado() {
  return (
    <div className="panel" style={{ marginTop: 24 }}>
      <EmptyState icono="search" titulo="Página no encontrada" accion={<Link className="btn btn--secondary" to="/">Volver al inicio</Link>}>
        La dirección no existe o no tiene acceso a ella.
      </EmptyState>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<Inicio />} />
        <Route path="solicitudes" element={<RequireAuth roles={[SOLICITANTE, AGENTE, COORDINADOR]}><SolicitudesPage /></RequireAuth>} />
        <Route path="solicitudes/nueva" element={<RequireAuth roles={[SOLICITANTE]}><NuevaSolicitudPage /></RequireAuth>} />
        <Route path="solicitudes/:id" element={<RequireAuth roles={[SOLICITANTE, AGENTE, COORDINADOR]}><SolicitudDetallePage /></RequireAuth>} />
        <Route path="indicadores" element={<RequireAuth roles={[COORDINADOR]}><IndicadoresPage /></RequireAuth>} />
        <Route path="exportar" element={<RequireAuth roles={[COORDINADOR]}><ExportacionPage /></RequireAuth>} />
        <Route path="auditoria" element={<RequireAuth roles={[AUDITOR]}><AuditoriaPage /></RequireAuth>} />
        <Route path="*" element={<NoEncontrado />} />
      </Route>
    </Routes>
  );
}
