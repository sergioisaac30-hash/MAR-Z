import { Router } from 'express';
import { crearControladorSolicitud } from '../controllers/solicitudController.js';
import { permitirRoles } from '../middleware/auth.js';
import { validarDatos } from '../middleware/validate.js';
import { ROLES } from '../domain/constantes.js';
import {
  idParam,
  cambiarPrioridadSchema,
  crearSolicitudSchema,
  listarSolicitudesQuery,
} from '../validators/solicitudValidators.js';
import { manejarAsync } from '../middleware/errorHandler.js';

const { SOLICITANTE, COORDINADOR } = ROLES;

// Rutas de solicitudes: crear, listar, ver detalle y cambiar prioridad.
export function solicitudRoutes({ services, requireAuth }) {
  const router = Router();
  const c = crearControladorSolicitud({ services });
  router.use(requireAuth);

  // HU02
  router.post('/', permitirRoles(SOLICITANTE), validarDatos({ body: crearSolicitudSchema }), manejarAsync(c.crear));
  // HU03 / HU04
  router.get('/', permitirRoles(SOLICITANTE, COORDINADOR), validarDatos({ query: listarSolicitudesQuery }), manejarAsync(c.listar));
  router.get('/:id', permitirRoles(SOLICITANTE, COORDINADOR), validarDatos({ params: idParam }), manejarAsync(c.obtener));
  // HU04
  router.patch(
    '/:id/prioridad',
    permitirRoles(COORDINADOR),
    validarDatos({ params: idParam, body: cambiarPrioridadSchema }),
    manejarAsync(c.cambiarPrioridad),
  );
  // Eliminar solicitud (borrado lógico, auditado).
  router.delete(
    '/:id',
    permitirRoles(SOLICITANTE, COORDINADOR),
    validarDatos({ params: idParam }),
    manejarAsync(c.eliminar),
  );
  return router;
}

// Ruta de catálogos: categorías, prioridades y estados para el formulario.
export function catalogoRoutes({ services, requireAuth }) {
  const router = Router();
  router.get('/', requireAuth, manejarAsync(async (_req, res) => res.json(await services.catalogos.obtener())));
  return router;
}
