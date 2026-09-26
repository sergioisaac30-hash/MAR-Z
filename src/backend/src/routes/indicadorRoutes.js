import { Router } from 'express';
import { permitirRoles } from '../middleware/auth.js';
import { validarDatos } from '../middleware/validate.js';
import { ROLES } from '../domain/constantes.js';
import { filtrosSolicitudSchema } from '../validators/solicitudValidators.js';
import { manejarAsync } from '../middleware/errorHandler.js';

// HU10 · Filtros reproducibles por estado, prioridad y categoría.
const indicadoresQuery = filtrosSolicitudSchema.pick({ estado: true, prioridad: true, categoriaId: true });

// Ruta de indicadores agregados del servicio (solo coordinador).
export function indicadorRoutes({ services, requireAuth }) {
  const router = Router();
  router.get(
    '/',
    requireAuth,
    permitirRoles(ROLES.COORDINADOR),
    validarDatos({ query: indicadoresQuery }),
    manejarAsync(async (req, res) => res.json(await services.indicadores.obtener(req.user, req.valid.query))),
  );
  return router;
}
