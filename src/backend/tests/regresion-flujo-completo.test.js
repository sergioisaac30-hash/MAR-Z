// Regresión completa (Sprint 3): el ciclo de vida de una solicitud atraviesa HU01–HU12 y
// cada paso queda reflejado en listado, indicadores, historial y exportación.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearContexto } from './helpers/context.js';
import { hoyLocal } from '../src/utils/fechas.js';

let ctx;
let u;
let id;
const manana = hoyLocal(new Date(Date.now() + 24 * 3600 * 1000));

beforeAll(async () => {
  ctx = await crearContexto();
  u = {};
  for (const clave of ['solNorte', 'coordinador', 'agente1', 'agente2', 'auditor']) u[clave] = await ctx.comoUsuario(clave); // HU01
});
afterAll(() => ctx.cerrar());

const ok = async (promesa, status = 200) => {
  const res = await promesa;
  expect(res.status, JSON.stringify(res.body)).toBe(status);
  return res.body;
};

describe('Regresión · flujo completo HU01–HU12', () => {
  it('recorre creación, priorización, asignación, atención, reapertura y cierre', async () => {
    const indicadoresAntes = await ok(u.coordinador.get('/api/indicadores'));

    // HU02 + CAM-01
    const creada = await ok(u.solNorte.post('/api/solicitudes', {
      titulo: 'Escáner de andén sin energía',
      descripcion: 'El escáner fijo del andén 4 no enciende desde esta mañana.',
      categoriaId: 1,
      prioridad: 'Alta',
      justificacionPrioridad: 'Sin escáner no se registran las salidas del andén.',
      fechaObjetivo: manana,
    }), 201);
    id = creada.id;
    // HU03
    expect((await ok(u.solNorte.get('/api/solicitudes'))).datos.map((s) => s.id)).toContain(id);
    // HU04 (bajar a Media limpia la justificación)
    expect((await ok(u.coordinador.patch(`/api/solicitudes/${id}/prioridad`, { prioridad: 'Media' }))).justificacionPrioridad).toBeNull();
    // HU05: asignar a uno y reasignar a otro
    await ok(u.coordinador.post(`/api/solicitudes/${id}/asignacion`, { agenteId: u.agente2.usuario.id }));
    await ok(u.coordinador.post(`/api/solicitudes/${id}/asignacion`, { agenteId: u.agente1.usuario.id }));
    expect((await u.agente2.get(`/api/solicitudes/${id}`)).status).toBe(404);
    // HU07 + HU06
    await ok(u.agente1.post(`/api/solicitudes/${id}/estado`, { estado: 'En progreso' }));
    await ok(u.agente1.post(`/api/solicitudes/${id}/comentarios`, { contenido: 'Fuente de poder reemplazada.' }), 201);
    await ok(u.agente1.post(`/api/solicitudes/${id}/estado`, { estado: 'Resuelta' }));
    // HU08: reabrir con motivo, volver a resolver y confirmar
    await ok(u.solNorte.post(`/api/solicitudes/${id}/reapertura`, { motivo: 'Se apaga después de una hora.' }));
    await ok(u.agente1.post(`/api/solicitudes/${id}/estado`, { estado: 'En progreso' }));
    await ok(u.agente1.post(`/api/solicitudes/${id}/estado`, { estado: 'Resuelta' }));
    const cerrada = await ok(u.solNorte.post(`/api/solicitudes/${id}/confirmacion`));
    expect(cerrada).toMatchObject({ estado: 'Cerrada', esFinal: true });

    // Una solicitud cerrada ya no admite cambios.
    expect((await u.coordinador.patch(`/api/solicitudes/${id}/prioridad`, { prioridad: 'Baja' })).status).toBe(409);
    expect((await u.agente1.post(`/api/solicitudes/${id}/comentarios`, { contenido: 'x' })).status).toBe(409);

    // HU09: aparece con la combinación de filtros correcta
    const filtrada = await ok(u.coordinador.get(`/api/solicitudes?estado=Cerrada&prioridad=Media&categoriaId=1&q=${encodeURIComponent('escáner')}`));
    expect(filtrada.datos.map((s) => s.id)).toEqual([id]);

    // HU10: los indicadores reflejan el cierre y los eventos
    const despues = await ok(u.coordinador.get('/api/indicadores'));
    const cerradas = (r) => r.volumenPorEstado.find((v) => v.estado === 'Cerrada').cantidad;
    expect(cerradas(despues)).toBe(cerradas(indicadoresAntes) + 1);
    expect(despues.tiempoMedianoCiclo.muestras).toBe(indicadoresAntes.tiempoMedianoCiclo.muestras + 1);
    const eventos = (r) => Object.fromEntries(r.eventosPorTipo.map((e) => [e.accion, e.cantidad]));
    const delta = Object.fromEntries(Object.entries(eventos(despues)).map(([k, v]) => [k, v - eventos(indicadoresAntes)[k]]));
    expect(delta).toEqual({ PRIORIDAD_CAMBIADA: 1, ASIGNACION: 2, ESTADO_CAMBIADO: 5, COMENTARIO_REGISTRADO: 1, CONFIRMACION: 1, REAPERTURA: 1 });

    // HU12: exportación filtrada y registrada
    const csv = await u.coordinador.post('/api/reportes/solicitudes', { q: 'escáner' });
    expect(csv.text).toContain(creada.codigo);
    expect(csv.text).not.toContain('Escáner de andén');

    // HU11: el auditor ve toda la historia, con actores codificados
    const historial = await ok(u.auditor.get(`/api/auditoria?solicitud=${creada.codigo}&tamano=100`));
    const acciones = new Set(historial.datos.map((e) => e.accion));
    for (const a of ['SOLICITUD_CREADA', 'PRIORIDAD_CAMBIADA', 'ASIGNACION', 'ESTADO_CAMBIADO', 'COMENTARIO_REGISTRADO', 'REAPERTURA', 'CONFIRMACION']) {
      expect(acciones.has(a)).toBe(true);
    }
    expect(historial.datos.every((e) => /^ACT-/.test(e.actor))).toBe(true);
    expect((await ok(u.auditor.get('/api/auditoria?accion=EXPORTACION'))).datos[0].actor).toBe(u.coordinador.usuario.codigoActor);

    // HU07: el historial del solicitante coincide con la secuencia de estados
    const estados = (await ok(u.solNorte.get(`/api/solicitudes/${id}/historial`))).datos.filter((e) => e.campo === 'estado').map((e) => e.valorNuevo);
    expect(estados).toEqual(['Nuevo', 'Asignada', 'En progreso', 'Resuelta', 'Reabierta', 'En progreso', 'Resuelta', 'Cerrada']);
  });

  it('HU01: al cerrar sesión se pierde el acceso', async () => {
    await ok(u.solNorte.post('/api/auth/logout'), 204);
    expect((await u.solNorte.get('/api/solicitudes')).status).toBe(401);
  });
});
