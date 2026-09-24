import { forbidden } from './errorHandler.js';

const SEGUROS = new Set(['GET', 'HEAD', 'OPTIONS']);
export const CSRF_HEADER = 'x-requested-with';
export const CSRF_VALUE = 'MesaSolicitudes';

// Toda petición que cambia datos debe traer esta cabecera especial.
// Así, un formulario de otra página no puede enviarla por nosotros.
export function protegerCsrf(req, _res, next) {
  if (SEGUROS.has(req.method) || req.get(CSRF_HEADER) === CSRF_VALUE) return next();
  return next(forbidden('Petición rechazada: falta la cabecera de protección CSRF.'));
}
