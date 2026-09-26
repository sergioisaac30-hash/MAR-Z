// PA-08 · HU08 Confirmar o reabrir solución
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearContexto } from './helpers/context.js';

let ctx;
let coordinador;
let agente;
let solNorte;
let solSur;

beforeAll(async () => {
  ctx = await crearContexto();
  coordinador = await ctx.comoUsuario('coordinador');
  agente = await ctx.comoUsuario('agente1');
  solNorte = await ctx.comoUsuario('solNorte');
  solSur = await ctx.comoUsuario('solSur');
});
afterAll(() => ctx.cerrar());

/** Lleva una solicitud nueva del solicitante hasta "Resuelta" usando la API. */
async function resuelta(solicitante = solNorte) {
  const s = await ctx.prisma.solicitud.findFirst({ where: { solicitanteId: solicitante.usuario.id, estadoId: 'Nuevo' } });
  await coordinador.post(`/api/solicitudes/${s.id}/asignacion`, { agenteId: agente.usuario.id });
  await agente.post(`/api/solicitudes/${s.id}/estado`, { estado: 'En progreso' });
  await agente.post(`/api/solicitudes/${s.id}/estado`, { estado: 'Resuelta' });
  return s;
}

describe('PA-08 · HU08 Confirmar o reabrir solución', () => {
  it('CA1: existe búsqueda por texto en título y descripción (solo en lo propio)', async () => {
    const porTitulo = await solNorte.get('/api/solicitudes?q=lector');
    expect(porTitulo.status).toBe(200);
    expect(porTitulo.body.datos.map((s) => s.titulo)).toEqual(['Lector de códigos no responde en muelle 3']);
    const porDescripcion = await solNorte.get('/api/solicitudes?q=emisión de guías');
    expect(porDescripcion.body.datos).toHaveLength(1);
    // "inventario" existe, pero en una solicitud de otro solicitante.
    expect((await solNorte.get('/api/solicitudes?q=inventario')).body.datos).toHaveLength(0);
    expect((await solSur.get('/api/solicitudes?q=inventario')).body.datos).toHaveLength(1);
  });

  it('CA2: el solicitante puede aceptar una solicitud en estado "Resuelta"', async () => {
    const s = await resuelta();
    const antes = Date.now();
    const res = await solNorte.post(`/api/solicitudes/${s.id}/confirmacion`);
    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('Cerrada');
    expect(res.body.esFinal).toBe(true);
    expect(new Date(res.body.cerradaEn).getTime()).toBeGreaterThanOrEqual(antes - 1000);
    expect(await ctx.prisma.cierre.count({ where: { solicitudId: s.id, tipo: 'CONFIRMACION' } })).toBe(1);
  });

  it('CA2: no se puede confirmar ni reabrir una solicitud que no está "Resuelta"', async () => {
    const nueva = await ctx.prisma.solicitud.findFirst({ where: { solicitanteId: solNorte.usuario.id, estadoId: 'Nuevo' } });
    expect((await solNorte.post(`/api/solicitudes/${nueva.id}/confirmacion`)).status).toBe(409);
    expect((await solNorte.post(`/api/solicitudes/${nueva.id}/reapertura`, { motivo: 'x' })).status).toBe(409);
    const cerrada = await ctx.prisma.solicitud.findFirst({ where: { estadoId: 'Cerrada' } });
    expect((await solNorte.post(`/api/solicitudes/${cerrada.id}/reapertura`, { motivo: 'Sigue fallando' })).status).toBe(409);
  });

  it('CA3: puede reabrirla proporcionando un motivo (obligatorio)', async () => {
    const s = await resuelta(solSur);
    for (const motivo of [undefined, '', '   ']) {
      const res = await solSur.post(`/api/solicitudes/${s.id}/reapertura`, { motivo });
      expect(res.status).toBe(400);
      expect(res.body.error.detalles[0].campo).toBe('motivo');
    }
    const res = await solSur.post(`/api/solicitudes/${s.id}/reapertura`, { motivo: 'El error volvió a aparecer al cierre del día.' });
    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('Reabierta');
    expect(res.body.ultimaReapertura.motivo).toBe('El error volvió a aparecer al cierre del día.');
    // El agente asignado ve el motivo y puede retomar la atención.
    const vistaAgente = await agente.get(`/api/solicitudes/${s.id}`);
    expect(vistaAgente.body.ultimaReapertura.motivo).toMatch(/volvió a aparecer/);
    expect((await agente.post(`/api/solicitudes/${s.id}/estado`, { estado: 'En progreso' })).status).toBe(200);
  });

  it('CA4: confirmación y reapertura quedan trazadas', async () => {
    const eventos = await ctx.prisma.auditoria.findMany({ where: { accionId: { in: ['CONFIRMACION', 'REAPERTURA'] } } });
    expect(eventos.map((e) => [e.accionId, e.campo, e.valorAnterior, e.valorNuevo])).toEqual(
      expect.arrayContaining([
        ['CONFIRMACION', 'estado', 'Resuelta', 'Cerrada'],
        ['REAPERTURA', 'estado', 'Resuelta', 'Reabierta'],
        ['REAPERTURA', 'motivo', null, 'El error volvió a aparecer al cierre del día.'],
      ]),
    );
    expect(eventos.every((e) => [solNorte.usuario.id, solSur.usuario.id].includes(e.actorId))).toBe(true);
  });

  it('Solo el solicitante propietario confirma o reabre', async () => {
    const s = await resuelta();
    expect((await solSur.post(`/api/solicitudes/${s.id}/confirmacion`)).status).toBe(404);
    for (const u of [agente, coordinador]) {
      expect((await u.post(`/api/solicitudes/${s.id}/confirmacion`)).status).toBe(403);
      expect((await u.post(`/api/solicitudes/${s.id}/reapertura`, { motivo: 'x' })).status).toBe(403);
    }
    expect((await ctx.prisma.solicitud.findUnique({ where: { id: s.id } })).estadoId).toBe('Resuelta');
  });

  it('Las confirmaciones y reaperturas registradas no pueden modificarse', async () => {
    const c = await ctx.prisma.cierre.findFirst();
    await expect(ctx.prisma.cierre.update({ where: { id: c.id }, data: { motivo: 'x' } })).rejects.toThrow(/no pueden modificarse/);
    await expect(ctx.prisma.$executeRawUnsafe(`DELETE FROM cierres WHERE id = ${c.id}`)).rejects.toMatchObject({ meta: { message: 'CIERRE_INMUTABLE' } });
  });
});
