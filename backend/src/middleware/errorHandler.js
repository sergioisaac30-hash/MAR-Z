import { Prisma } from '@prisma/client';

// Error propio de la app: tiene código HTTP y un código de texto para el frontend.
export class ErrorApp extends Error {
  constructor(status, codigo, mensaje, detalles) {
    super(mensaje);
    this.status = status;
    this.codigo = codigo;
    this.detalles = detalles;
  }
}

// Funciones cortas para crear errores comunes.
export const badRequest = (codigo, mensaje, detalles) => new ErrorApp(400, codigo, mensaje, detalles);
export const unauthorized = (mensaje = 'Debe iniciar sesión.') => new ErrorApp(401, 'NO_AUTENTICADO', mensaje);
export const forbidden = (mensaje = 'No tiene permiso para realizar esta acción.') =>
  new ErrorApp(403, 'ACCESO_DENEGADO', mensaje);
// También se usa para recursos fuera del alcance del usuario: no revela que existen.
export const notFound = (mensaje = 'Recurso no encontrado.') => new ErrorApp(404, 'NO_ENCONTRADO', mensaje);
export const conflict = (codigo, mensaje, detalles) => new ErrorApp(409, codigo, mensaje, detalles);

// Express 4 no atrapa errores de promesas: esto envuelve cada ruta async.
export const manejarAsync = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Se ejecuta cuando la ruta pedida no existe.
export function rutaNoEncontrada(_req, res) {
  res.status(404).json({ error: { codigo: 'RUTA_NO_ENCONTRADA', mensaje: 'La ruta solicitada no existe.' } });
}

const respuesta = (res, status, codigo, mensaje) => res.status(status).json({ error: { codigo, mensaje } });

// Convierte cualquier error en una respuesta clara, sin mostrar detalles internos.
// Nota: SQLite avisa la violación de un trigger como P2003, por eso se trata igual que P2010.
// eslint-disable-next-line no-unused-vars
export function manejarErrores(err, _req, res, _next) {
  if (err instanceof ErrorApp) {
    return res.status(err.status).json({
      error: { codigo: err.codigo, mensaje: err.message, ...(err.detalles ? { detalles: err.detalles } : {}) },
    });
  }
  if (err?.type === 'entity.parse.failed') return respuesta(res, 400, 'JSON_INVALIDO', 'El cuerpo de la petición no es JSON válido.');
  if (err?.type === 'entity.too.large') return respuesta(res, 413, 'CARGA_EXCESIVA', 'La petición es demasiado grande.');

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') return respuesta(res, 409, 'DUPLICADO', 'El registro ya existe.');
    if (err.code === 'P2003' || err.code === 'P2010') {
      return respuesta(res, 409, 'REGLA_DE_INTEGRIDAD', 'La operación viola una regla de integridad de los datos.');
    }
  }
  console.error(err);
  return respuesta(res, 500, 'ERROR_INTERNO', 'Ocurrió un error inesperado.');
}
