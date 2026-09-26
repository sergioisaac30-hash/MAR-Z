import { ROLES } from '../../auth/roles.js';

const ESTADOS_ASIGNABLES = ['Nuevo', 'Asignada', 'En progreso', 'En espera', 'Reabierta'];

// Reglas de "Eliminar solicitud": solicitante (propia y en estado Nuevo) o coordinador (siempre).
// El backend vuelve a validar estas reglas; esto solo evita mostrar una acción que fallaría.
export function puedeEliminarSolicitud(usuario, s) {
  if (usuario.rol === ROLES.COORDINADOR) return true;
  if (usuario.rol === ROLES.SOLICITANTE) return s.estado === 'Nuevo';
  return false;
}

// HU05 · Solo el coordinador asigna, y solo mientras la solicitud admite un responsable.
export function puedeAsignar(usuario, s) {
  return usuario.rol === ROLES.COORDINADOR && ESTADOS_ASIGNABLES.includes(s.estado);
}

// HU06 · Solo el agente asignado comenta, y solo mientras la solicitud no esté cerrada.
export function puedeComentar(usuario, s) {
  return usuario.rol === ROLES.AGENTE && !s.esFinal;
}

// HU08 · Solo el solicitante propietario confirma o reabre, y solo en estado "Resuelta".
export function puedeConfirmarOReabrir(usuario, s) {
  return usuario.rol === ROLES.SOLICITANTE && s.estado === 'Resuelta';
}
