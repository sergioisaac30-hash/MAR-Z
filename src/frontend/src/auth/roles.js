// Roles que puede tener un usuario.
export const ROLES = Object.freeze({
  SOLICITANTE: 'SOLICITANTE',
  AGENTE: 'AGENTE',
  COORDINADOR: 'COORDINADOR',
  AUDITOR: 'AUDITOR',
});

const { SOLICITANTE, AGENTE, COORDINADOR, AUDITOR } = ROLES;

// Enlaces del menú lateral, según el rol de quien inició sesión.
export const NAVEGACION = [
  { grupo: 'Menú', to: '/solicitudes', etiqueta: 'Mis solicitudes', icono: 'inbox', roles: [SOLICITANTE], hu: 'HU03' },
  { grupo: 'Menú', to: '/solicitudes/nueva', etiqueta: 'Nueva solicitud', icono: 'plus', roles: [SOLICITANTE], hu: 'HU02' },
  { grupo: 'Menú', to: '/solicitudes', etiqueta: 'Priorización', icono: 'flag', roles: [COORDINADOR], hu: 'HU04' },
  { grupo: 'Menú', to: '/solicitudes', etiqueta: 'Asignadas a mí', icono: 'inbox', roles: [AGENTE], hu: 'HU05' },
  { grupo: 'Menú', to: '/indicadores', etiqueta: 'Indicadores', icono: 'grid', roles: [COORDINADOR], hu: 'HU10' },
  { grupo: 'Menú', to: '/exportar', etiqueta: 'Exportar', icono: 'download', roles: [COORDINADOR], hu: 'HU12' },
  { grupo: 'Menú', to: '/auditoria', etiqueta: 'Historial de cambios', icono: 'shield', roles: [AUDITOR], hu: 'HU11' },
];
