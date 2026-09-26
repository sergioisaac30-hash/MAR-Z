// CAM-02 (Sprint 3) · El auditor tiene acceso de solo lectura al historial (HU11).
// La parte de CAM-02 sobre el CSV sin texto libre se verifica en PA-12.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearContexto } from './helpers/context.js';

let ctx;
let auditor;
beforeAll(async () => {
  ctx = await crearContexto();
  auditor = await ctx.comoUsuario('auditor');
});
afterAll(() => ctx.cerrar());

describe('CAM-02 · Auditor en solo lectura', () => {
  it('el auditor no puede crear, priorizar, asignar, comentar, cambiar estado, confirmar ni reabrir', async () => {
    const id = 1;
    const intentos = [
      auditor.post('/api/solicitudes', { titulo: 't', descripcion: 'd', categoriaId: 1 }),
      auditor.patch(`/api/solicitudes/${id}/prioridad`, { prioridad: 'Baja' }),
      auditor.post(`/api/solicitudes/${id}/asignacion`, { agenteId: 3 }),
      auditor.post(`/api/solicitudes/${id}/comentarios`, { contenido: 'x' }),
      auditor.post(`/api/solicitudes/${id}/estado`, { estado: 'Resuelta' }),
      auditor.post(`/api/solicitudes/${id}/confirmacion`),
      auditor.post(`/api/solicitudes/${id}/reapertura`, { motivo: 'x' }),
    ];
    for (const res of await Promise.all(intentos)) expect(res.status).toBe(403);
  });

  it('el auditor tampoco consulta solicitudes, indicadores ni exportaciones: solo el historial', async () => {
    expect((await auditor.get('/api/solicitudes')).status).toBe(403);
    expect((await auditor.get('/api/solicitudes/1')).status).toBe(403);
    expect((await auditor.get('/api/indicadores')).status).toBe(403);
    expect((await auditor.get('/api/auditoria')).status).toBe(200);
  });

  it('las operaciones rechazadas no dejan cambios ni eventos', async () => {
    const antes = await ctx.prisma.auditoria.count();
    await auditor.patch('/api/solicitudes/1/prioridad', { prioridad: 'Baja' });
    expect(await ctx.prisma.auditoria.count()).toBe(antes);
  });

  it('el historial es inmutable también fuera de la API (ORM y SQL)', async () => {
    const e = await ctx.prisma.auditoria.findFirst();
    await expect(ctx.prisma.auditoria.update({ where: { id: e.id }, data: { valorNuevo: 'x' } })).rejects.toThrow(/no pueden modificarse/);
    await expect(ctx.prisma.auditoria.deleteMany({})).rejects.toThrow(/no pueden modificarse/);
    await expect(ctx.prisma.$executeRawUnsafe(`UPDATE auditoria SET valor_nuevo = 'x' WHERE id = ${e.id}`)).rejects.toMatchObject({ meta: { message: 'AUDITORIA_INMUTABLE' } });
    await expect(ctx.prisma.$executeRawUnsafe('DELETE FROM auditoria')).rejects.toMatchObject({ meta: { message: 'AUDITORIA_INMUTABLE' } });
  });
});
