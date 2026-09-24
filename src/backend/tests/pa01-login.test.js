// PA-01 · HU01 Iniciar sesión
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import bcrypt from 'bcryptjs';
import { CSRF, EMAILS, crearContexto } from './helpers/context.js';
import { PASSWORD_DEMO } from '../src/db/seed.js';

let ctx;
beforeAll(async () => { ctx = await crearContexto(); });
afterAll(() => ctx.cerrar());

const login = (email, password) => ctx.request().post('/api/auth/login').set(CSRF).send({ email, password });

describe('PA-01 · HU01 Iniciar sesión', () => {
  it('CA1: credenciales válidas permiten el acceso y emiten una cookie httpOnly', async () => {
    const res = await login(EMAILS.solNorte, PASSWORD_DEMO);
    expect(res.status).toBe(200);
    expect(res.body.usuario).toMatchObject({ email: EMAILS.solNorte, rol: 'SOLICITANTE' });
    expect(res.body.usuario).not.toHaveProperty('passwordHash');
    const cookie = res.headers['set-cookie'][0];
    expect(cookie).toMatch(/mesa_sesion=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Strict/i);
  });

  it('CA1: el correo no distingue mayúsculas', async () => {
    expect((await login('  Coordinador@MESA.test ', PASSWORD_DEMO)).status).toBe(200);
  });

  it('CA2: contraseña incorrecta, usuario inexistente y usuario inactivo reciben la misma respuesta', async () => {
    const malaClave = await login(EMAILS.solNorte, 'incorrecta');
    const inexistente = await login('nadie@mesa.test', PASSWORD_DEMO);
    const inactivo = await login(EMAILS.agenteInactivo, PASSWORD_DEMO);
    for (const res of [malaClave, inexistente, inactivo]) {
      expect(res.status).toBe(401);
      expect(res.headers['set-cookie']).toBeUndefined();
    }
    expect(inexistente.body).toEqual(malaClave.body);
    expect(inactivo.body).toEqual(malaClave.body);
    expect(malaClave.body.error.mensaje).not.toMatch(/existe|usuario/i);
  });

  it('CA2: datos de login incompletos se rechazan con validación', async () => {
    const res = await login('', '');
    expect(res.status).toBe(400);
    expect(res.body.error.codigo).toBe('VALIDACION');
  });

  it('CA3: la sesión puede cerrarse y el token deja de ser válido en el servidor', async () => {
    const res = await login(EMAILS.solSur, PASSWORD_DEMO);
    const cookie = res.headers['set-cookie'][0].split(';')[0];
    expect((await ctx.request().get('/api/auth/me').set('Cookie', cookie)).status).toBe(200);

    const salida = await ctx.request().post('/api/auth/logout').set(CSRF).set('Cookie', cookie);
    expect(salida.status).toBe(204);
    // Reutilizar el mismo token tras el cierre debe fallar.
    expect((await ctx.request().get('/api/auth/me').set('Cookie', cookie)).status).toBe(401);
  });

  it('CA3: sin sesión, las rutas protegidas responden 401', async () => {
    expect((await ctx.request().get('/api/solicitudes')).status).toBe(401);
    expect((await ctx.request().get('/api/auth/me')).status).toBe(401);
  });

  it('CA3: un token manipulado es rechazado', async () => {
    const res = await ctx.request().get('/api/auth/me').set('Cookie', 'mesa_sesion=eyJhbGciOiJub25lIn0.e30.');
    expect(res.status).toBe(401);
  });

  it('CA4: un usuario no puede acceder a funciones de otro rol (validado en la API)', async () => {
    const solicitante = await ctx.comoUsuario('solNorte');
    const coordinador = await ctx.comoUsuario('coordinador');
    const auditor = await ctx.comoUsuario('auditor');
    const agente = await ctx.comoUsuario('agente1');

    expect((await solicitante.patch('/api/solicitudes/1/prioridad', { prioridad: 'Alta' })).status).toBe(403);
    expect((await agente.patch('/api/solicitudes/1/prioridad', { prioridad: 'Alta' })).status).toBe(403);
    expect((await coordinador.post('/api/solicitudes', { titulo: 't', descripcion: 'd', categoriaId: 1 })).status).toBe(403);
    expect((await auditor.post('/api/solicitudes', { titulo: 't', descripcion: 'd', categoriaId: 1 })).status).toBe(403);
    expect((await auditor.get('/api/solicitudes')).status).toBe(403);
  });

  it('Seguridad: las peticiones que modifican datos exigen la cabecera anti-CSRF', async () => {
    const res = await ctx.request().post('/api/auth/login').send({ email: EMAILS.solNorte, password: PASSWORD_DEMO });
    expect(res.status).toBe(403);
  });

  it('Seguridad: las contraseñas se almacenan con hash bcrypt y nunca en texto plano', async () => {
    const usuarios = await ctx.prisma.usuario.findMany();
    for (const u of usuarios) {
      expect(u.passwordHash).not.toBe(PASSWORD_DEMO);
      expect(u.passwordHash).toMatch(/^\$2[aby]\$/);
      expect(await bcrypt.compare(PASSWORD_DEMO, u.passwordHash)).toBe(true);
    }
  });

  it('Seguridad: la base de datos rechaza una contraseña en texto plano', async () => {
    // Vía SQL directa: el trigger aborta con su mensaje.
    await expect(
      ctx.prisma.$executeRawUnsafe(
        `INSERT INTO usuarios (codigo_actor, nombre, email, password_hash, rol_id, actualizado_en)
         VALUES ('ACT-ZZZ8', 'Prueba', 'plano2@mesa.test', 'texto-plano', 1, CURRENT_TIMESTAMP)`,
      ),
    ).rejects.toMatchObject({ meta: { message: 'PASSWORD_HASH_INVALIDO' } });
    // Vía ORM: Prisma informa el abort del trigger como P2003 (ver DEF-01), pero no se inserta nada.
    await expect(
      ctx.prisma.usuario.create({
        data: { codigoActor: 'ACT-ZZZ9', nombre: 'Prueba', email: 'plano@mesa.test', passwordHash: 'texto-plano', rolId: 1 },
      }),
    ).rejects.toThrow();
    expect(await ctx.prisma.usuario.count({ where: { email: { in: ['plano@mesa.test', 'plano2@mesa.test'] } } })).toBe(0);
  });
});
