// CAM-01 (Sprint 2) · La prioridad Alta requiere justificación y fecha objetivo. Afecta HU02 y HU04.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearContexto } from './helpers/context.js';
import { hoyLocal } from '../src/utils/fechas.js';

let ctx;
let solicitante;
let coordinador;
beforeAll(async () => {
  ctx = await crearContexto();
  solicitante = await ctx.comoUsuario('solNorte');
  coordinador = await ctx.comoUsuario('coordinador');
});
afterAll(() => ctx.cerrar());

const manana = hoyLocal(new Date(Date.now() + 24 * 3600 * 1000));
const ayer = hoyLocal(new Date(Date.now() - 24 * 3600 * 1000));
const base = { titulo: 'Caída de red en bodega', descripcion: 'Sin red en toda la bodega 2.', categoriaId: 2 };
const campos = (res) => res.body.error.detalles.map((d) => d.campo);

describe('CAM-01 en HU02 · crear solicitud con prioridad Alta', () => {
  it('rechaza Alta sin justificación ni fecha objetivo', async () => {
    const res = await solicitante.post('/api/solicitudes', { ...base, prioridad: 'Alta' });
    expect(res.status).toBe(400);
    expect(campos(res)).toEqual(expect.arrayContaining(['justificacionPrioridad', 'fechaObjetivo']));
  });

  it('rechaza una justificación vacía o una fecha objetivo pasada o inválida', async () => {
    const vacia = await solicitante.post('/api/solicitudes', { ...base, prioridad: 'Alta', justificacionPrioridad: '   ', fechaObjetivo: manana });
    expect(campos(vacia)).toContain('justificacionPrioridad');
    const pasada = await solicitante.post('/api/solicitudes', { ...base, prioridad: 'Alta', justificacionPrioridad: 'Urgente', fechaObjetivo: ayer });
    expect(campos(pasada)).toContain('fechaObjetivo');
    const invalida = await solicitante.post('/api/solicitudes', { ...base, prioridad: 'Alta', justificacionPrioridad: 'Urgente', fechaObjetivo: '2026-02-30' });
    expect(campos(invalida)).toContain('fechaObjetivo');
  });

  it('acepta Alta con justificación y fecha objetivo, y lo deja trazado', async () => {
    const res = await solicitante.post('/api/solicitudes', {
      ...base,
      prioridad: 'Alta',
      justificacionPrioridad: 'Detiene la recepción de mercancía.',
      fechaObjetivo: manana,
    });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ prioridad: 'Alta', justificacionPrioridad: 'Detiene la recepción de mercancía.', fechaObjetivo: manana });
    const campos = (await ctx.prisma.auditoria.findMany({ where: { solicitudId: res.body.id } })).map((a) => a.campo);
    expect(campos).toEqual(expect.arrayContaining(['justificacion_prioridad', 'fecha_objetivo']));
  });

  it('para otras prioridades descarta justificación y fecha objetivo', async () => {
    const res = await solicitante.post('/api/solicitudes', { ...base, prioridad: 'Media', justificacionPrioridad: 'x', fechaObjetivo: manana });
    expect(res.status).toBe(201);
    expect(res.body.justificacionPrioridad).toBeNull();
    expect(res.body.fechaObjetivo).toBeNull();
  });
});

describe('CAM-01 en HU04 · priorizar a Alta', () => {
  it('el coordinador no puede subir a Alta sin justificación y fecha objetivo', async () => {
    const s = await ctx.prisma.solicitud.findFirst({ where: { prioridadId: 'Media', estadoId: { not: 'Cerrada' } } });
    const res = await coordinador.patch(`/api/solicitudes/${s.id}/prioridad`, { prioridad: 'Alta' });
    expect(res.status).toBe(400);
    expect(campos(res)).toEqual(expect.arrayContaining(['justificacionPrioridad', 'fechaObjetivo']));
  });

  it('con justificación y fecha objetivo el cambio se aplica y cada campo queda en auditoría', async () => {
    const s = await ctx.prisma.solicitud.findFirst({ where: { prioridadId: 'Media', estadoId: { not: 'Cerrada' } } });
    const res = await coordinador.patch(`/api/solicitudes/${s.id}/prioridad`, {
      prioridad: 'Alta',
      justificacionPrioridad: 'Afecta a tres sitios.',
      fechaObjetivo: manana,
    });
    expect(res.status).toBe(200);
    const eventos = await ctx.prisma.auditoria.findMany({ where: { solicitudId: s.id, accionId: 'PRIORIDAD_CAMBIADA' } });
    expect(eventos.map((e) => [e.campo, e.valorAnterior, e.valorNuevo])).toEqual(
      expect.arrayContaining([
        ['prioridad', 'Media', 'Alta'],
        ['justificacion_prioridad', null, 'Afecta a tres sitios.'],
        ['fecha_objetivo', null, manana],
      ]),
    );
  });

  it('actualizar solo la fecha objetivo de una Alta es un cambio válido y trazado', async () => {
    const s = await ctx.prisma.solicitud.findFirst({ where: { prioridadId: 'Alta', justificacionPrioridad: { not: null }, estadoId: { not: 'Cerrada' } } });
    const nueva = hoyLocal(new Date(Date.now() + 5 * 24 * 3600 * 1000));
    const res = await coordinador.patch(`/api/solicitudes/${s.id}/prioridad`, {
      prioridad: 'Alta',
      justificacionPrioridad: s.justificacionPrioridad,
      fechaObjetivo: nueva,
    });
    expect(res.status).toBe(200);
    const ultimo = await ctx.prisma.auditoria.findFirst({ where: { solicitudId: s.id }, orderBy: { id: 'desc' } });
    expect(ultimo).toMatchObject({ campo: 'fecha_objetivo', valorNuevo: nueva });
  });

  it('bajar de Alta a Media limpia justificación y fecha objetivo y lo registra', async () => {
    const s = await ctx.prisma.solicitud.findFirst({ where: { prioridadId: 'Alta', justificacionPrioridad: { not: null }, estadoId: { not: 'Cerrada' } } });
    const res = await coordinador.patch(`/api/solicitudes/${s.id}/prioridad`, { prioridad: 'Media' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ prioridad: 'Media', justificacionPrioridad: null, fechaObjetivo: null });
    const campos = (await ctx.prisma.auditoria.findMany({ where: { solicitudId: s.id, valorNuevo: null, accionId: 'PRIORIDAD_CAMBIADA' } })).map((a) => a.campo);
    expect(campos).toEqual(expect.arrayContaining(['justificacion_prioridad', 'fecha_objetivo']));
  });

  it('la base de datos también impide una Alta sin justificación', async () => {
    const s = await ctx.prisma.solicitud.findFirst({ where: { prioridadId: 'Baja' } });
    await expect(
      ctx.prisma.$executeRawUnsafe(`UPDATE solicitudes SET prioridad = 'Alta' WHERE id = ${s.id}`),
    ).rejects.toMatchObject({ meta: { message: 'JUSTIFICACION_ALTA_REQUERIDA' } });
  });
});
