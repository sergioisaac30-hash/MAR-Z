import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import request from 'supertest';
import { config } from '../../src/config/env.js';
import { createPrismaClient } from '../../src/db/prisma.js';
import { seedDemo, PASSWORD_DEMO } from '../../src/db/seed.js';
import { createApp } from '../../src/app.js';
import { TEMPLATE_DB, TMP_DIR } from './globalSetup.js';

export const EMAILS = {
  solNorte: 'solicitante.norte@mesa.test',
  solSur: 'solicitante.sur@mesa.test',
  agente1: 'agente.uno@mesa.test',
  agente2: 'agente.dos@mesa.test',
  agenteInactivo: 'agente.tres@mesa.test',
  coordinador: 'coordinador@mesa.test',
  auditor: 'auditor@mesa.test',
};

export const CSRF = { 'X-Requested-With': 'MesaSolicitudes' };

/**
 * Crea una base aislada (copia de la plantilla migrada), la carga con datos semilla y
 * devuelve la app junto con utilidades para iniciar sesión como cada usuario de prueba.
 */
export async function crearContexto() {
  const archivo = path.join(TMP_DIR, `prueba-${crypto.randomUUID()}.db`);
  fs.copyFileSync(TEMPLATE_DB, archivo);
  const prisma = createPrismaClient(`file:${archivo}`);
  await seedDemo(prisma, { rounds: 4 });
  const app = createApp({ prisma, config });

  async function comoUsuario(clave) {
    const agent = request.agent(app);
    const res = await agent.post('/api/auth/login').set(CSRF).send({ email: EMAILS[clave], password: PASSWORD_DEMO });
    if (res.status !== 200) throw new Error(`No se pudo iniciar sesión como ${clave}: ${res.status}`);
    return {
      agent,
      usuario: res.body.usuario,
      get: (url) => agent.get(url),
      post: (url, body) => agent.post(url).set(CSRF).send(body),
      patch: (url, body) => agent.patch(url).set(CSRF).send(body),
      put: (url, body) => agent.put(url).set(CSRF).send(body),
      delete: (url) => agent.delete(url).set(CSRF),
    };
  }

  async function cerrar() {
    await prisma.$disconnect();
    fs.rmSync(archivo, { force: true });
  }

  return { app, prisma, comoUsuario, cerrar, request: () => request(app) };
}
