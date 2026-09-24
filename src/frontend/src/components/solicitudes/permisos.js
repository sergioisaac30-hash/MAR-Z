import { ROLES } from '../../auth/roles.js';

// Reglas de "Eliminar solicitud": solicitante (propia y en estado Nuevo) o coordinador (siempre).
// El backend vuelve a validar estas reglas; esto solo evita mostrar una acción que fallaría.
export function puedeEliminarSolicitud(usuario, s) {
  if (usuario.rol === ROLES.COORDINADOR) return true;
  if (usuario.rol === ROLES.SOLICITANTE) return s.estado === 'Nuevo';
  return false;
}
