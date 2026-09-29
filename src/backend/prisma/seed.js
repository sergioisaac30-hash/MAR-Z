import { createPrismaClient } from '../src/db/prisma.js';
import { config } from '../src/config/env.js';
import { seedDemo, PASSWORD_DEMO, USUARIOS_DEMO } from '../src/db/seed.js';

const prisma = createPrismaClient();
try {
  // La aplicación arranca sin solicitudes: solo aparecen las que creen los usuarios.
  const resultado = await seedDemo(prisma, { rounds: config.bcryptRounds, conSolicitudes: false });
  if (resultado.omitido) {
    console.log('[seed] La base ya contiene usuarios: no se insertaron datos de prueba.');
  } else {
    console.log('[seed] Usuarios de prueba creados (sin solicitudes). Contraseña común:', PASSWORD_DEMO);
    for (const u of USUARIOS_DEMO) console.log(`  - ${u.email.padEnd(30)} ${u.estado ?? 'Activo'}`);
  }
} finally {
  await prisma.$disconnect();
}
