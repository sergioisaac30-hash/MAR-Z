import { PrismaClient } from '@prisma/client';

// Crea el cliente Prisma de la app. Permite indicar otra base (se usa en las pruebas).
export function createPrismaClient(datasourceUrl) {
  return new PrismaClient(datasourceUrl ? { datasourceUrl } : undefined);
}
