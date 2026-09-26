// PA-07 · HU07 Cambiar estado
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearContexto } from './helpers/context.js';

let ctx;
let coordinador;
let agente1;
let agente2;
let solicitante;
let s;
beforeAll(async () => {
  ctx = await crearContexto();
  coordinador = await ctx.comoUsuario('coordinador');
  agente1 = await ctx.comoUsuario('agente1');
  agente2 = await ctx.comoUsuario('agente2');
  solicitante = await ctx.comoUsuario('solNorte');
  s = await ctx.prisma.solicitud.findFirst({ where: { solicitanteId: solicitante.usuario.id, estadoId: 'Nuevo' } });
  await coordinador.post(`/api/solicitudes/${s.id}/asignacion`, { agenteId: agente1.usuario.id });
});
afterAll(() => ctx.cerrar());

const estado = (destino) => agente1.post(`/api/solicitudes/${s.id}/estado`, { estado: destino });
const estadoActual = async () => (await ctx.prisma.solicitud.findUnique({ where: { id: s.id } })).estadoId;

describe('PA-07 · HU07 Cambiar estado', () => {
  it('Las transiciones disponibles dependen del estado y del rol', async () => {
    const res = await agente1.get(`/api/solicitudes/${s.id}/transiciones`);
    expect(res.body).toEqual({ estadoActual: 'Asignada', destinos: ['En progreso'] });
    expect((await solicitante.get(`/api/solicitudes/${s.id}/transiciones`)).body.destinos).toEqual([]);
  });

  it('CA3: una transición inválida se rechaza y no modifica nada', async () => {
    const eventos = await ctx.prisma.auditoria.count({ where: { solicitudId: s.id } });
    for (const destino of ['Resuelta', 'Cerrada', 'Nuevo', 'Asignada', 'Reabierta', 'En espera']) {
      const res = await estado(destino);
      expect(res.status).toBe(409);
      expect(res.body.error.codigo).toBe('TRANSICION_INVALIDA');
    }
    expect(await estadoActual()).toBe('Asignada');
    expect(await ctx.prisma.auditoria.count({ where: { solicitudId: s.id } })).toBe(eventos);
  });

  it('CA3: un estado inexistente se rechaza por validación', async () => {
    expect((await estado('Terminada')).status).toBe(400);
  });

  it('CA1: permite el flujo válido Asignada → En progreso → En espera → En progreso → Resuelta', async () => {
    for (const destino of ['En progreso', 'En espera', 'En progreso', 'Resuelta']) {
      const res = await estado(destino);
      expect(res.status).toBe(200);
      expect(res.body.estado).toBe(destino);
    }
    expect(await estadoActual()).toBe('Resuelta');
  });

  it('CA3: el agente no puede cerrar ni reabrir: son decisiones del solicitante', async () => {
    expect((await estado('Cerrada')).status).toBe(409);
    expect((await estado('Reabierta')).status).toBe(409);
  });

  it('CA2: existe historial completo con actor codificado, fecha, campo y valores', async () => {
    const res = await solicitante.get(`/api/solicitudes/${s.id}/historial`);
    expect(res.status).toBe(200);
    const estados = res.body.datos.filter((e) => e.campo === 'estado').map((e) => [e.valorAnterior, e.valorNuevo]);
    expect(estados).toEqual([
      [null, 'Nuevo'],
      ['Nuevo', 'Asignada'],
      ['Asignada', 'En progreso'],
      ['En progreso', 'En espera'],
      ['En espera', 'En progreso'],
      ['En progreso', 'Resuelta'],
    ]);
    const cambio = res.body.datos.find((e) => e.valorNuevo === 'Resuelta');
    expect(cambio.actor).toEqual({ codigo: agente1.usuario.codigoActor, rol: 'Agente' });
    expect(new Date(cambio.fecha).toString()).not.toBe('Invalid Date');
    expect(JSON.stringify(res.body)).not.toContain(agente1.usuario.email);
    expect(JSON.stringify(res.body)).not.toContain(agente1.usuario.nombre);
  });

  it('Solo el agente asignado cambia el estado por esta vía', async () => {
    const otra = await ctx.prisma.solicitud.findFirst({ where: { estadoId: 'Nuevo' } });
    await coordinador.post(`/api/solicitudes/${otra.id}/asignacion`, { agenteId: agente1.usuario.id });
    expect((await agente2.post(`/api/solicitudes/${otra.id}/estado`, { estado: 'En progreso' })).status).toBe(404);
    expect((await coordinador.post(`/api/solicitudes/${otra.id}/estado`, { estado: 'En progreso' })).status).toBe(403);
    expect((await solicitante.post(`/api/solicitudes/${otra.id}/estado`, { estado: 'En progreso' })).status).toBe(403);
  });

  it('El historial no es accesible fuera del alcance del usuario', async () => {
    expect((await agente2.get(`/api/solicitudes/${s.id}/historial`)).status).toBe(404);
    const otro = await ctx.comoUsuario('solSur');
    expect((await otro.get(`/api/solicitudes/${s.id}/historial`)).status).toBe(404);
  });
});
