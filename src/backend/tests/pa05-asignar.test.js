// PA-05 · HU05 Asignar solicitud
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearContexto } from './helpers/context.js';

let ctx;
let coordinador;
let agente1;
let agente2;
let ids;
beforeAll(async () => {
  ctx = await crearContexto();
  coordinador = await ctx.comoUsuario('coordinador');
  agente1 = await ctx.comoUsuario('agente1');
  agente2 = await ctx.comoUsuario('agente2');
  const u = await ctx.prisma.usuario.findMany();
  ids = Object.fromEntries(u.map((x) => [x.email.split('@')[0], x.id]));
});
afterAll(() => ctx.cerrar());

const nuevaSinAsignar = () => ctx.prisma.solicitud.findFirst({ where: { estadoId: 'Nuevo', asignaciones: { none: {} } } });

describe('PA-05 · HU05 Asignar solicitud', () => {
  it('CA1–CA2: la lista de agentes solo incluye agentes con estado Activo', async () => {
    const res = await coordinador.get('/api/agentes');
    expect(res.status).toBe(200);
    const usuarios = await ctx.prisma.usuario.findMany({ where: { id: { in: res.body.datos.map((a) => a.id) } } });
    expect(usuarios.every((u) => u.estado === 'Activo' && u.rolId === 2)).toBe(true);
    expect(res.body.datos.map((a) => a.id)).not.toContain(ids['agente.tres']);
    expect(res.body.datos[0]).not.toHaveProperty('email');
  });

  it('CA1–CA4: asigna a un agente activo y registra quién y cuándo', async () => {
    const s = await nuevaSinAsignar();
    const antes = Date.now();
    const res = await coordinador.post(`/api/solicitudes/${s.id}/asignacion`, { agenteId: ids['agente.uno'] });
    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('Asignada');
    expect(res.body.asignacion.agente.id).toBe(ids['agente.uno']);
    expect(res.body.asignacion.asignadoPor.codigoActor).toBe(coordinador.usuario.codigoActor);

    const asignacion = await ctx.prisma.asignacion.findFirst({ where: { solicitudId: s.id, vigente: true } });
    expect(asignacion.asignadoPor).toBe(coordinador.usuario.id);
    expect(asignacion.asignadoEn.getTime()).toBeGreaterThanOrEqual(antes - 1000);

    const eventos = await ctx.prisma.auditoria.findMany({ where: { solicitudId: s.id, actorId: coordinador.usuario.id } });
    expect(eventos.map((e) => [e.accionId, e.campo, e.valorAnterior, e.valorNuevo])).toEqual(
      expect.arrayContaining([
        ['ASIGNACION', 'agente_asignado', null, 'ACT-A1K5'],
        ['ESTADO_CAMBIADO', 'estado', 'Nuevo', 'Asignada'],
      ]),
    );
  });

  it('CA5: el agente recibe una notificación dentro de la aplicación', async () => {
    const res = await agente1.get('/api/notificaciones');
    expect(res.status).toBe(200);
    expect(res.body.noLeidas).toBeGreaterThanOrEqual(1);
    const [n] = res.body.datos;
    expect(n).toMatchObject({ tipo: 'ASIGNACION', leidaEn: null });
    expect(n.mensaje).toMatch(/^Se le asignó la solicitud SOL-\d{5}/);

    expect((await agente1.patch(`/api/notificaciones/${n.id}/leida`)).status).toBe(204);
    const despues = await agente1.get('/api/notificaciones');
    expect(despues.body.noLeidas).toBe(res.body.noLeidas - 1);
  });

  it('CA5: nadie puede leer ni marcar notificaciones ajenas', async () => {
    const [n] = (await agente1.get('/api/notificaciones')).body.datos;
    expect((await agente2.get('/api/notificaciones')).body.datos.map((x) => x.id)).not.toContain(n.id);
    expect((await agente2.patch(`/api/notificaciones/${n.id}/leida`)).status).toBe(404);
  });

  it('CA1/CA6: rechaza asignar a un agente inactivo, a otro rol o a un usuario inexistente', async () => {
    const s = await nuevaSinAsignar();
    for (const agenteId of [ids['agente.tres'], ids.coordinador, ids['solicitante.norte'], 9999]) {
      const res = await coordinador.post(`/api/solicitudes/${s.id}/asignacion`, { agenteId });
      expect(res.status).toBe(400);
      expect(res.body.error.codigo).toBe('AGENTE_NO_VALIDO');
    }
    expect(await ctx.prisma.asignacion.count({ where: { solicitudId: s.id } })).toBe(0);
  });

  it('CA6: rechaza reasignar al mismo agente y asignar solicitudes resueltas o cerradas', async () => {
    const asignada = await ctx.prisma.asignacion.findFirst({ where: { vigente: true } });
    const mismo = await coordinador.post(`/api/solicitudes/${asignada.solicitudId}/asignacion`, { agenteId: asignada.agenteId });
    expect(mismo.status).toBe(409);

    const s = await nuevaSinAsignar();
    await ctx.prisma.solicitud.update({ where: { id: s.id }, data: { estadoId: 'Cerrada' } });
    const cerrada = await coordinador.post(`/api/solicitudes/${s.id}/asignacion`, { agenteId: ids['agente.uno'] });
    expect(cerrada.status).toBe(409);
    expect(cerrada.body.error.codigo).toBe('ESTADO_NO_ASIGNABLE');
  });

  it('CA6: solo el coordinador puede asignar y consultar agentes', async () => {
    const s = await nuevaSinAsignar();
    for (const clave of ['solNorte', 'agente1', 'auditor']) {
      const u = await ctx.comoUsuario(clave);
      expect((await u.post(`/api/solicitudes/${s.id}/asignacion`, { agenteId: ids['agente.uno'] })).status).toBe(403);
      expect((await u.get('/api/agentes')).status).toBe(403);
    }
  });

  it('Reasignación: el agente anterior pierde el acceso y solo hay una asignación vigente', async () => {
    const s = await nuevaSinAsignar();
    await coordinador.post(`/api/solicitudes/${s.id}/asignacion`, { agenteId: ids['agente.uno'] });
    expect((await agente1.get(`/api/solicitudes/${s.id}`)).status).toBe(200);
    expect((await agente2.get(`/api/solicitudes/${s.id}`)).status).toBe(404);

    const res = await coordinador.post(`/api/solicitudes/${s.id}/asignacion`, { agenteId: ids['agente.dos'] });
    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('Asignada');
    expect((await agente1.get(`/api/solicitudes/${s.id}`)).status).toBe(404);
    expect((await agente2.get(`/api/solicitudes/${s.id}`)).status).toBe(200);
    expect(await ctx.prisma.asignacion.count({ where: { solicitudId: s.id, vigente: true } })).toBe(1);
    const ultimo = await ctx.prisma.auditoria.findFirst({ where: { solicitudId: s.id, accionId: 'ASIGNACION' }, orderBy: { id: 'desc' } });
    expect(ultimo).toMatchObject({ valorAnterior: 'ACT-A1K5', valorNuevo: 'ACT-A9P3' });
  });

  it('El agente solo lista las solicitudes que tiene asignadas', async () => {
    const res = await agente2.get('/api/solicitudes');
    const propias = await ctx.prisma.asignacion.findMany({ where: { agenteId: ids['agente.dos'], vigente: true } });
    expect(res.body.datos.map((s) => s.id).sort()).toEqual(propias.map((a) => a.solicitudId).sort());
  });

  it('La base de datos impide asignar a un agente inactivo o duplicar la asignación vigente', async () => {
    const s = await nuevaSinAsignar();
    await expect(
      ctx.prisma.$executeRawUnsafe(
        `INSERT INTO asignaciones (solicitud_id, agente_id, asignado_por, asignado_en, vigente) VALUES (${s.id}, ${ids['agente.tres']}, ${ids.coordinador}, CURRENT_TIMESTAMP, 1)`,
      ),
    ).rejects.toMatchObject({ meta: { message: 'AGENTE_NO_ACTIVO' } });
    const vigente = await ctx.prisma.asignacion.findFirst({ where: { vigente: true } });
    await expect(
      ctx.prisma.$executeRawUnsafe(
        `INSERT INTO asignaciones (solicitud_id, agente_id, asignado_por, asignado_en, vigente) VALUES (${vigente.solicitudId}, ${ids['agente.uno']}, ${ids.coordinador}, CURRENT_TIMESTAMP, 1)`,
      ),
    ).rejects.toMatchObject({ meta: { message: 'ASIGNACION_VIGENTE_DUPLICADA' } });
  });
});
