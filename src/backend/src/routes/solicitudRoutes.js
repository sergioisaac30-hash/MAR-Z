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
import { asignarSchema, cambiarEstadoSchema, comentarioSchema, reaperturaSchema } from '../validators/flujoValidators.js';
import { manejarAsync } from '../middleware/errorHandler.js';

const { SOLICITANTE, AGENTE, COORDINADOR } = ROLES;

// Rutas de solicitudes: crear, listar, ver detalle, cambiar prioridad y el flujo del Sprint 2.
export function solicitudRoutes({ services, requireAuth }) {
  const router = Router();
  const c = crearControladorSolicitud({ services });
  router.use(requireAuth);

  // HU02
  router.post('/', permitirRoles(SOLICITANTE), validarDatos({ body: crearSolicitudSchema }), manejarAsync(c.crear));
  // HU03 / HU04 · el agente consulta solo las solicitudes que tiene asignadas (HU05)
  router.get('/', permitirRoles(SOLICITANTE, AGENTE, COORDINADOR), validarDatos({ query: listarSolicitudesQuery }), manejarAsync(c.listar));
  router.get('/:id', permitirRoles(SOLICITANTE, AGENTE, COORDINADOR), validarDatos({ params: idParam }), manejarAsync(c.obtener));
  // HU04
  router.patch(
    '/:id/prioridad',
    permitirRoles(COORDINADOR),
    validarDatos({ params: idParam, body: cambiarPrioridadSchema }),
    manejarAsync(c.cambiarPrioridad),
  );
  // Eliminar solicitud (borrado lógico, auditado).
  router.delete('/:id', permitirRoles(SOLICITANTE, COORDINADOR), validarDatos({ params: idParam }), manejarAsync(c.eliminar));
  // HU05
  router.post(
    '/:id/asignacion',
    permitirRoles(COORDINADOR),
    validarDatos({ params: idParam, body: asignarSchema }),
    manejarAsync(c.asignar),
  );
  // HU06 · lectura según alcance; el comentario solo lo crea el agente asignado. Sin edición ni borrado.
  router.get('/:id/comentarios', permitirRoles(SOLICITANTE, AGENTE, COORDINADOR), validarDatos({ params: idParam }), manejarAsync(c.listarComentarios));
  router.post(
    '/:id/comentarios',
    permitirRoles(AGENTE),
    validarDatos({ params: idParam, body: comentarioSchema }),
    manejarAsync(c.comentar),
  );
  // HU07 · transiciones disponibles, cambio de estado (agente asignado) e historial de la solicitud
  router.get('/:id/transiciones', permitirRoles(SOLICITANTE, AGENTE, COORDINADOR), validarDatos({ params: idParam }), manejarAsync(c.transiciones));
  router.post(
    '/:id/estado',
    permitirRoles(AGENTE),
    validarDatos({ params: idParam, body: cambiarEstadoSchema }),
    manejarAsync(c.cambiarEstado),
  );
  router.get('/:id/historial', permitirRoles(SOLICITANTE, AGENTE, COORDINADOR), validarDatos({ params: idParam }), manejarAsync(c.historial));
  // HU08 · confirmar o reabrir (solo el solicitante propietario)
  router.post('/:id/confirmacion', permitirRoles(SOLICITANTE), validarDatos({ params: idParam }), manejarAsync(c.confirmar));
  router.post(
    '/:id/reapertura',
    permitirRoles(SOLICITANTE),
    validarDatos({ params: idParam, body: reaperturaSchema }),
    manejarAsync(c.reabrir),
  );
  return router;
}

// Ruta de catálogos: categorías, prioridades y estados para el formulario.
export function catalogoRoutes({ services, requireAuth }) {
  const router = Router();
  router.get('/', requireAuth, manejarAsync(async (_req, res) => res.json(await services.catalogos.obtener())));
  return router;
}
