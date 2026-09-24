import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth } from './auth/RequireAuth.jsx';
import { ROLES } from './auth/roles.js';
import { AppShell } from './components/layout/AppShell.jsx';
import { EmptyState } from './components/ui/componentes.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SolicitudesPage from './pages/SolicitudesPage.jsx';
import NuevaSolicitudPage from './pages/NuevaSolicitudPage.jsx';
import SolicitudDetallePage from './pages/SolicitudDetallePage.jsx';

const { SOLICITANTE, COORDINADOR } = ROLES;

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
        <Route index element={<Navigate to="/solicitudes" replace />} />
        <Route path="solicitudes" element={<SolicitudesPage />} />
        <Route path="solicitudes/nueva" element={<RequireAuth roles={[SOLICITANTE]}><NuevaSolicitudPage /></RequireAuth>} />
        <Route path="solicitudes/:id" element={<RequireAuth roles={[SOLICITANTE, COORDINADOR]}><SolicitudDetallePage /></RequireAuth>} />
        <Route path="*" element={<NoEncontrado />} />
      </Route>
    </Routes>
  );
}
