// PA-04 · HU04 Priorizar solicitudes
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearContexto } from './helpers/context.js';

let ctx;
let coordinador;
beforeAll(async () => {
  ctx = await crearContexto();
  coordinador = await ctx.comoUsuario('coordinador');
});
afterAll(() => ctx.cerrar());

const ORDEN_PRIORIDAD = { Baja: 1, Media: 2, Alta: 3 };

describe('PA-04 · HU04 Priorizar solicitudes', () => {
  it('CA1: la prioridad debe ser válida', async () => {
    for (const prioridad of ['Crítica', '', null, 5]) {
      const res = await coordinador.patch('/api/solicitudes/1/prioridad', { prioridad });
      expect(res.status).toBe(400);
    }
  });

  it('CA2: el cambio queda trazable (actor, valor anterior y nuevo)', async () => {
    const solicitud = await ctx.prisma.solicitud.findFirst({ where: { prioridadId: 'Baja', estadoId: { not: 'Cerrada' } } });
    const res = await coordinador.patch(`/api/solicitudes/${solicitud.id}/prioridad`, { prioridad: 'Media' });
    expect(res.status).toBe(200);
    expect(res.body.prioridad).toBe('Media');
    const evento = await ctx.prisma.auditoria.findFirst({
      where: { solicitudId: solicitud.id, accionId: 'PRIORIDAD_CAMBIADA' },
      orderBy: { id: 'desc' },
    });
    expect(evento).toMatchObject({ actorId: coordinador.usuario.id, campo: 'prioridad', valorAnterior: 'Baja', valorNuevo: 'Media' });
  });

  it('CA2: asignar la misma prioridad no genera cambio ni evento', async () => {
    const solicitud = await ctx.prisma.solicitud.findFirst({ where: { prioridadId: 'Media', estadoId: { not: 'Cerrada' } } });
    const antes = await ctx.prisma.auditoria.count();
    const res = await coordinador.patch(`/api/solicitudes/${solicitud.id}/prioridad`, { prioridad: 'Media' });
    expect(res.status).toBe(409);
    expect(await ctx.prisma.auditoria.count()).toBe(antes);
  });

  it('CA3: la lista puede ordenarse por prioridad', async () => {
    const desc = (await coordinador.get('/api/solicitudes?orden=prioridad&dir=desc')).body.datos;
    const valores = desc.map((s) => ORDEN_PRIORIDAD[s.prioridad]);
    expect(valores).toEqual([...valores].sort((a, b) => b - a));
    const asc = (await coordinador.get('/api/solicitudes?orden=prioridad&dir=asc')).body.datos;
    expect(asc[0].prioridad).toBe('Baja');
  });

  it('CA3: la lista puede ordenarse por estado', async () => {
    const res = await coordinador.get('/api/solicitudes?orden=estado&dir=asc');
    expect(res.status).toBe(200);
    const { estados } = (await coordinador.get('/api/catalogos')).body;
    const orden = Object.fromEntries(estados.map((e, i) => [e.codigo, i]));
    const valores = res.body.datos.map((s) => orden[s.estado]);
    expect(valores).toEqual([...valores].sort((a, b) => a - b));
  });

  it('CA3: la lista puede ordenarse por fecha (asc y desc)', async () => {
    const asc = (await coordinador.get('/api/solicitudes?orden=fecha&dir=asc')).body.datos.map((s) => s.creadaEn);
    expect(asc).toEqual([...asc].sort());
    const desc = (await coordinador.get('/api/solicitudes?orden=fecha&dir=desc')).body.datos.map((s) => s.creadaEn);
    expect(desc).toEqual([...desc].sort().reverse());
  });

  it('CA3: un criterio de orden no permitido se rechaza', async () => {
    expect((await coordinador.get('/api/solicitudes?orden=titulo')).status).toBe(400);
  });

  it('CA4: solo el coordinador puede modificar la prioridad', async () => {
    for (const clave of ['solNorte', 'agente1', 'auditor']) {
      const usuario = await ctx.comoUsuario(clave);
      expect((await usuario.patch('/api/solicitudes/1/prioridad', { prioridad: 'Alta' })).status).toBe(403);
    }
    const s = await ctx.prisma.solicitud.findUnique({ where: { id: 1 } });
    expect(s.prioridadId).not.toBe('Crítica');
  });

  it('El coordinador ve todas las solicitudes para poder priorizarlas', async () => {
    const res = await coordinador.get('/api/solicitudes');
    expect(res.body.datos).toHaveLength(await ctx.prisma.solicitud.count());
  });
});
