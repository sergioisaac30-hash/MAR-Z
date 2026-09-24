// Roles que puede tener un usuario.
export const ROLES = Object.freeze({
  SOLICITANTE: 'SOLICITANTE',
  AGENTE: 'AGENTE',
  COORDINADOR: 'COORDINADOR',
  AUDITOR: 'AUDITOR',
});

export const PRIORIDADES = Object.freeze(['Baja', 'Media', 'Alta']);
export const PRIORIDAD_POR_DEFECTO = 'Media';

// Estados posibles de una solicitud.
export const ESTADOS = Object.freeze({
  NUEVO: 'Nuevo',
  ASIGNADA: 'Asignada',
  EN_PROGRESO: 'En progreso',
  EN_ESPERA: 'En espera',
  RESUELTA: 'Resuelta',
  REABIERTA: 'Reabierta',
  CERRADA: 'Cerrada',
});

export const ESTADO_USUARIO = Object.freeze({ ACTIVO: 'Activo', INACTIVO: 'Inactivo' });

// Acciones que se guardan en el historial de auditoría.
export const ACCIONES = Object.freeze({
  SOLICITUD_CREADA: 'SOLICITUD_CREADA',
  PRIORIDAD_CAMBIADA: 'PRIORIDAD_CAMBIADA',
  SOLICITUD_ELIMINADA: 'SOLICITUD_ELIMINADA',
});

// Código visible de una solicitud. Se calcula a partir del id; no se guarda en la base.
export function formatCodigo(id) {
  return `SOL-${String(id).padStart(5, '0')}`;
}

export function parseCodigo(texto) {
  const match = /^SOL-?(\d{1,9})$/i.exec(String(texto).trim());
  return match ? Number.parseInt(match[1], 10) : null;
}
