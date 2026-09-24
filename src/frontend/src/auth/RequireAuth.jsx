import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import { EmptyState, Loading } from '../components/ui/componentes.jsx';

/**
 * Protege rutas del frontend: sin sesión redirige al login; con un rol no permitido
 * muestra "Acceso no autorizado". La API aplica las mismas reglas de forma independiente.
 */
export function RequireAuth({ roles, children }) {
  const { usuario, cargando } = useAuth();
  const location = useLocation();

  if (cargando) {
    return (
      <div className="full-center">
        <Loading texto="Verificando sesión…" />
      </div>
    );
  }
  if (!usuario) return <Navigate to="/login" replace state={{ desde: location.pathname + location.search }} />;
  if (roles && !roles.includes(usuario.rol)) {
    return (
      <div className="panel" style={{ marginTop: 24 }}>
        <EmptyState icono="lock" titulo="Acceso no autorizado" accion={<Link className="btn btn--secondary" to="/">Volver al inicio</Link>}>
          Su rol no tiene permiso para consultar esta sección.
        </EmptyState>
      </div>
    );
  }
  return children;
}
