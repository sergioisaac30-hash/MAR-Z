import { Router } from 'express';
import { permitirRoles } from '../middleware/auth.js';
import { validarDatos } from '../middleware/validate.js';
import { ROLES } from '../domain/constantes.js';
import { filtrosSolicitudSchema } from '../validators/solicitudValidators.js';
import { manejarAsync } from '../middleware/errorHandler.js';

/**
 * HU12 · Exportación CSV (solo coordinador). Es POST porque tiene efecto: la exportación
 * queda registrada; por eso también exige la cabecera anti-CSRF.
 */
export function reporteRoutes({ services, requireAuth }) {
  const router = Router();
  router.post(
    '/solicitudes',
    requireAuth,
    permitirRoles(ROLES.COORDINADOR),
    validarDatos({ body: filtrosSolicitudSchema }),
    manejarAsync(async (req, res) => {
      const { csv, filas, nombreArchivo } = await services.exportaciones.exportarSolicitudes(req.user, req.valid.body);
      res.set({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
        'X-Filas-Exportadas': String(filas),
        'Access-Control-Expose-Headers': 'Content-Disposition, X-Filas-Exportadas',
      });
      res.send(csv);
    }),
  );
  return router;
}
