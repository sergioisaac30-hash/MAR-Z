import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { Router } from 'express';
import { protegerCsrf } from './middleware/csrf.js';
import { manejarErrores, rutaNoEncontrada } from './middleware/errorHandler.js';
import { verificarSesion } from './middleware/auth.js';
import { authRoutes } from './routes/authRoutes.js';
import { solicitudRoutes, catalogoRoutes } from './routes/solicitudRoutes.js';
import { crearServicioAuth } from './services/authService.js';
import { crearServicioCatalogo, crearServicioSolicitud } from './services/solicitudService.js';

// Junta todos los servicios que usa la app.
function crearServicios({ prisma, config }) {
  return {
    auth: crearServicioAuth({ prisma, config }),
    catalogos: crearServicioCatalogo({ prisma }),
    solicitudes: crearServicioSolicitud({ prisma }),
  };
}

// Junta todas las rutas bajo /api.
function crearRouterApi({ services, config }) {
  const router = Router();
  const deps = { services, config, requireAuth: verificarSesion({ config, services }) };

  router.get('/salud', (_req, res) => res.json({ estado: 'ok' }));
  router.use('/auth', authRoutes(deps));
  router.use('/catalogos', catalogoRoutes(deps));
  router.use('/solicitudes', solicitudRoutes(deps));
  return router;
}

// Fábrica de la aplicación: permite usar otra base de datos en las pruebas.
export function createApp({ prisma, config }) {
  const services = crearServicios({ prisma, config });
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  app.use('/api', (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  app.use('/api', protegerCsrf, crearRouterApi({ services, config }));
  app.use('/api', rutaNoEncontrada);

  // En producción la API también sirve la SPA ya compilada (frontend/dist).
  if (config.isProduction && fs.existsSync(config.frontendDist)) {
    app.use(express.static(config.frontendDist));
    app.get('*', (_req, res) => res.sendFile(path.join(config.frontendDist, 'index.html')));
  }

  app.use(manejarErrores);
  return app;
}
