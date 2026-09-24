import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { crearControladorAuth } from '../controllers/authController.js';
import { validarDatos } from '../middleware/validate.js';
import { loginSchema } from '../validators/authValidators.js';
import { manejarAsync } from '../middleware/errorHandler.js';

// Rutas de inicio y cierre de sesión.
export function authRoutes({ services, config, requireAuth }) {
  const router = Router();
  const controller = crearControladorAuth({ services, config });
  const limitarIntentos = rateLimit({
    windowMs: config.loginWindowMinutes * 60 * 1000,
    limit: config.loginMaxAttempts,
    // Solo cuentan los intentos fallidos; entrar bien no gasta intentos.
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, res) =>
      res.status(429).json({
        error: { codigo: 'DEMASIADOS_INTENTOS', mensaje: 'Demasiados intentos. Espere unos minutos e inténtelo de nuevo.' },
      }),
  });

  router.post('/login', limitarIntentos, validarDatos({ body: loginSchema }), manejarAsync(controller.login));
  router.post('/logout', requireAuth, manejarAsync(controller.logout));
  router.get('/me', requireAuth, controller.me);
  return router;
}
