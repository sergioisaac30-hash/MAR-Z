import { PrismaClient } from '@prisma/client';
import { ErrorApp } from '../middleware/errorHandler.js';

// Modelos cuyo contenido no puede modificarse ni borrarse una vez creado.
export const MODELOS_INMUTABLES = ['auditoria', 'comentario', 'cierre'];
const OPERACIONES_BLOQUEADAS = ['update', 'updateMany', 'upsert', 'delete', 'deleteMany'];

function bloquear(modelo) {
  return Object.fromEntries(
    OPERACIONES_BLOQUEADAS.map((op) => [
      op,
      () => {
        throw new ErrorApp(409, 'REGISTRO_INMUTABLE', `Los registros de ${modelo} no pueden modificarse.`);
      },
    ]),
  );
}

// Crea el cliente Prisma de la app. Permite indicar otra base (se usa en las pruebas).
// La extensión impide, a nivel de código, tocar los registros inmutables; los
// triggers de la base de datos lo impiden también a nivel SQL.
export function createPrismaClient(datasourceUrl) {
  const base = new PrismaClient(datasourceUrl ? { datasourceUrl } : undefined);
  return base.$extends({
    query: Object.fromEntries(MODELOS_INMUTABLES.map((m) => [m, bloquear(m)])),
  });
}
