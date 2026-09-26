// PA-11 · HU11 Historial de auditoría
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearContexto } from './helpers/context.js';

let ctx;
let auditor;
beforeAll(async () => {
  ctx = await crearContexto();
  auditor = await ctx.comoUsuario('auditor');
});
afterAll(() => ctx.cerrar());

const historial = (qs = {}) => auditor.get(`/api/auditoria?${new URLSearchParams(qs)}`);

describe('PA-11 · HU11 Historial de auditoría', () => {
  it('CA2: muestra actor codificado, fecha, campo, valor anterior y valor nuevo', async () => {
    const res = await historial({ tamano: 100 });
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(await ctx.prisma.auditoria.count());
    const e = res.body.datos.find((d) => d.accion === 'ESTADO_CAMBIADO');
    expect(e).toEqual(expect.objectContaining({
      actor: expect.stringMatching(/^ACT-[A-Z0-9]{4}$/),
      fecha: expect.any(String),
      campo: 'estado',
      valorAnterior: expect.any(String),
      valorNuevo: expect.any(String),
      solicitud: expect.stringMatching(/^SOL-\d{5}$/),
    }));
  });

  it('CA2: el actor nunca aparece con nombre ni correo', async () => {
    const texto = JSON.stringify((await historial({ tamano: 100 })).body.datos);
    for (const u of await ctx.prisma.usuario.findMany()) {
      expect(texto).not.toContain(u.nombre);
      expect(texto).not.toContain(u.email);
    }
  });

  it('Filtra por acción, por solicitud (código) y por rango de fechas, con paginación', async () => {
    const porAccion = await historial({ accion: 'REAPERTURA' });
    expect(porAccion.body.datos.length).toBeGreaterThan(0);
    expect(porAccion.body.datos.every((d) => d.accion === 'REAPERTURA')).toBe(true);

    const referencia = await ctx.prisma.solicitud.findFirst({ orderBy: { id: 'asc' } });
    const codigo = `SOL-${String(referencia.id).padStart(5, '0')}`;
    const porSolicitud = await historial({ solicitud: codigo });
    expect(porSolicitud.body.total).toBe(await ctx.prisma.auditoria.count({ where: { solicitudId: referencia.id } }));

    const hoy = new Date().toISOString().slice(0, 10);
    expect((await historial({ desde: '2000-01-01', hasta: '2000-01-31' })).body.total).toBe(0);
    expect((await historial({ desde: '2000-01-01', hasta: hoy })).body.total).toBeGreaterThan(0);

    const total = (await historial({ tamano: 100 })).body.total;
    expect(total).toBeGreaterThan(10);
    const p1 = await historial({ tamano: 10, pagina: 1 });
    const p2 = await historial({ tamano: 10, pagina: 2 });
    expect(p1.body.datos).toHaveLength(10);
    expect(p1.body.datos[0].id).not.toBe(p2.body.datos[0].id);
  });

  it('Rechaza filtros no válidos', async () => {
    for (const qs of [{ solicitud: 'abc' }, { desde: '23/09/2026' }, { desde: '2026-09-10', hasta: '2026-09-01' }, { tamano: 1000 }]) {
      expect((await historial(qs)).status).toBe(400);
    }
  });

  it('CA3: el acceso está restringido al auditor', async () => {
    for (const clave of ['solNorte', 'agente1', 'coordinador']) {
      const u = await ctx.comoUsuario(clave);
      expect((await u.get('/api/auditoria')).status).toBe(403);
    }
    expect((await ctx.request().get('/api/auditoria')).status).toBe(401);
  });

  it('CA1: solo lectura — cualquier método de escritura se rechaza', async () => {
    const [evento] = (await historial()).body.datos;
    expect((await auditor.post('/api/auditoria', { campo: 'x' })).status).toBe(405);
    expect((await auditor.put(`/api/auditoria/${evento.id}`, { valorNuevo: 'x' })).status).toBe(405);
    expect((await auditor.patch(`/api/auditoria/${evento.id}`, { valorNuevo: 'x' })).status).toBe(405);
    expect((await auditor.delete(`/api/auditoria/${evento.id}`)).status).toBe(405);
    const bd = await ctx.prisma.auditoria.findUnique({ where: { id: evento.id } });
    expect(bd.valorNuevo).toBe(evento.valorNuevo);
  });
});
