// PA-02 · HU02 Crear solicitud
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearContexto } from './helpers/context.js';

let ctx;
let solicitante;
beforeAll(async () => {
  ctx = await crearContexto();
  solicitante = await ctx.comoUsuario('solNorte');
});
afterAll(() => ctx.cerrar());

const valida = { titulo: 'Terminal portátil sin batería', descripcion: 'La terminal 12 no carga en la base.', categoriaId: 1 };

describe('PA-02 · HU02 Crear solicitud', () => {
  it('CA4–CA7: genera ID y fecha, estado inicial "Nuevo" y propietario = usuario autenticado', async () => {
    const antes = Date.now();
    const res = await solicitante.post('/api/solicitudes', valida);
    expect(res.status).toBe(201);
    expect(res.body.id).toEqual(expect.any(Number));
    expect(res.body.codigo).toMatch(/^SOL-\d{5}$/);
    expect(new Date(res.body.creadaEn).getTime()).toBeGreaterThanOrEqual(antes - 1000);
    expect(res.body.estado).toBe('Nuevo');
    const bd = await ctx.prisma.solicitud.findUnique({ where: { id: res.body.id } });
    expect(bd.solicitanteId).toBe(solicitante.usuario.id);
  });

  it.each([
    ['titulo', { ...valida, titulo: undefined }],
    ['titulo', { ...valida, titulo: '    ' }],
    ['descripcion', { ...valida, descripcion: undefined }],
    ['descripcion', { ...valida, descripcion: '' }],
    ['categoriaId', { ...valida, categoriaId: undefined }],
  ])('CA1–CA3: %s es obligatorio', async (campo, cuerpo) => {
    const res = await solicitante.post('/api/solicitudes', cuerpo);
    expect(res.status).toBe(400);
    expect(res.body.error.detalles.map((d) => d.campo)).toContain(campo);
  });

  it('CA3: una categoría inexistente se rechaza', async () => {
    const res = await solicitante.post('/api/solicitudes', { ...valida, categoriaId: 999 });
    expect(res.status).toBe(400);
    expect(res.body.error.detalles[0].campo).toBe('categoriaId');
  });

  it('CA6–CA7: el cliente no puede imponer estado, propietario ni fechas', async () => {
    const res = await solicitante.post('/api/solicitudes', {
      ...valida,
      estado: 'Cerrada',
      solicitanteId: 2,
      creadaEn: '2000-01-01T00:00:00Z',
    });
    expect(res.status).toBe(201);
    expect(res.body.estado).toBe('Nuevo');
    expect(res.body.creadaEn.startsWith('2000')).toBe(false);
    const bd = await ctx.prisma.solicitud.findUnique({ where: { id: res.body.id } });
    expect(bd.solicitanteId).toBe(solicitante.usuario.id);
  });

  it('La prioridad inicial por defecto es Media y debe ser válida', async () => {
    expect((await solicitante.post('/api/solicitudes', valida)).body.prioridad).toBe('Media');
    expect((await solicitante.post('/api/solicitudes', { ...valida, prioridad: 'Urgentísima' })).status).toBe(400);
  });

  it('La creación queda registrada en auditoría con el actor', async () => {
    const res = await solicitante.post('/api/solicitudes', valida);
    const eventos = await ctx.prisma.auditoria.findMany({ where: { solicitudId: res.body.id } });
    expect(eventos).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ accionId: 'SOLICITUD_CREADA', campo: 'estado', valorNuevo: 'Nuevo', actorId: solicitante.usuario.id }),
      ]),
    );
  });
});
