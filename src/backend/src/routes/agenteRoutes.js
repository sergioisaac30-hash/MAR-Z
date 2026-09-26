import { Router } from 'express';
import { permitirRoles } from '../middleware/auth.js';
import { ROLES } from '../domain/constantes.js';
import { manejarAsync } from '../middleware/errorHandler.js';

// HU05 · Agentes activos disponibles para asignar (solo el coordinador).
export function agenteRoutes({ services, requireAuth }) {
  const router = Router();
  router.get(
    '/',
    requireAuth,
    permitirRoles(ROLES.COORDINADOR),
    manejarAsync(async (_req, res) => res.json({ datos: await services.asignaciones.agentesActivos() })),
  );
  return router;
}
