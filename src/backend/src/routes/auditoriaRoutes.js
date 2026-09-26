import { Router } from 'express';
import { permitirRoles } from '../middleware/auth.js';
import { validarDatos } from '../middleware/validate.js';
import { ROLES } from '../domain/constantes.js';
import { auditoriaQuery } from '../validators/auditoriaValidators.js';
import { manejarAsync, ErrorApp } from '../middleware/errorHandler.js';

/**
 * HU11 + CAM-02 · Historial de auditoría: acceso restringido al auditor y en solo lectura.
 * Cualquier método distinto de GET se rechaza explícitamente.
 */
export function auditoriaRoutes({ services, requireAuth }) {
  const router = Router();
  router.use(requireAuth, permitirRoles(ROLES.AUDITOR));
  router.get('/', validarDatos({ query: auditoriaQuery }), manejarAsync(async (req, res) => res.json(await services.auditoria.listar(req.valid.query))));
  router.all('*', (_req, _res, next) => next(new ErrorApp(405, 'SOLO_LECTURA', 'El historial de auditoría es de solo lectura.')));
  return router;
}
