import { Router } from 'express';
import { validarDatos } from '../middleware/validate.js';
import { idParam } from '../validators/solicitudValidators.js';
import { manejarAsync } from '../middleware/errorHandler.js';

// HU05 · Notificaciones dentro de la aplicación (cada usuario, las suyas).
export function notificacionRoutes({ services, requireAuth }) {
  const router = Router();
  const { notificaciones } = services;
  router.use(requireAuth);

  router.get('/', manejarAsync(async (req, res) => res.json(await notificaciones.listar(req.user))));
  router.post(
    '/leidas',
    manejarAsync(async (req, res) => {
      await notificaciones.marcarTodas(req.user);
      res.status(204).end();
    }),
  );
  router.patch(
    '/:id/leida',
    validarDatos({ params: idParam }),
    manejarAsync(async (req, res) => {
      await notificaciones.marcarLeida(req.user, req.valid.params.id);
      res.status(204).end();
    }),
  );
  return router;
}
