// Roles que puede tener un usuario.
export const ROLES = Object.freeze({
  SOLICITANTE: 'SOLICITANTE',
  AGENTE: 'AGENTE',
  COORDINADOR: 'COORDINADOR',
  AUDITOR: 'AUDITOR',
});

const { SOLICITANTE, COORDINADOR } = ROLES;

// Enlaces del menú lateral, según el rol de quien inició sesión.
export const NAVEGACION = [
  { grupo: 'Menú', to: '/solicitudes', etiqueta: 'Mis solicitudes', icono: 'inbox', roles: [SOLICITANTE], hu: 'HU03' },
  { grupo: 'Menú', to: '/solicitudes/nueva', etiqueta: 'Nueva solicitud', icono: 'plus', roles: [SOLICITANTE], hu: 'HU02' },
  { grupo: 'Menú', to: '/solicitudes', etiqueta: 'Priorización', icono: 'flag', roles: [COORDINADOR], hu: 'HU04' },
];
