import { badRequest } from './errorHandler.js';

// Convierte los errores de zod al formato que espera el frontend.
function detalles(error) {
  return error.issues.map((i) => ({ campo: i.path.join('.'), mensaje: i.message }));
}

// Revisa body/query/params con esquemas zod y guarda el resultado en req.valid.
export function validarDatos(schemas) {
  return (req, _res, next) => {
    req.valid = req.valid ?? {};
    for (const parte of ['params', 'query', 'body']) {
      const schema = schemas[parte];
      if (!schema) continue;
      const result = schema.safeParse(req[parte] ?? {});
      if (!result.success) {
        return next(badRequest('VALIDACION', 'Los datos enviados no son válidos.', detalles(result.error)));
      }
      req.valid[parte] = result.data;
    }
    return next();
  };
}
