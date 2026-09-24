import { config } from './config/env.js';
import { createPrismaClient } from './db/prisma.js';
import { createApp } from './app.js';

const prisma = createPrismaClient();
const app = createApp({ prisma, config });

const server = app.listen(config.port, () => {
  console.log(`[api] Mesa de Solicitudes escuchando en http://localhost:${config.port}`);
});

async function cerrar() {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on('SIGINT', cerrar);
process.on('SIGTERM', cerrar);
