// PA-03 · HU03 Consultar mis solicitudes
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearContexto } from './helpers/context.js';

let ctx;
let norte;
let sur;
beforeAll(async () => {
  ctx = await crearContexto();
  norte = await ctx.comoUsuario('solNorte');
  sur = await ctx.comoUsuario('solSur');
});
afterAll(() => ctx.cerrar());

describe('PA-03 · HU03 Consultar mis solicitudes', () => {
  it('CA1: el solicitante solo visualiza sus propias solicitudes', async () => {
    const res = await norte.get('/api/solicitudes');
    expect(res.status).toBe(200);
    const propias = await ctx.prisma.solicitud.count({ where: { solicitanteId: norte.usuario.id } });
    expect(res.body.datos).toHaveLength(propias);
    const ids = res.body.datos.map((s) => s.id);
    const ajenas = await ctx.prisma.solicitud.findMany({ where: { id: { in: ids }, NOT: { solicitanteId: norte.usuario.id } } });
    expect(ajenas).toHaveLength(0);
  });

  it('CA2: puede abrir el detalle de una solicitud propia', async () => {
    const [primera] = (await norte.get('/api/solicitudes')).body.datos;
    const res = await norte.get(`/api/solicitudes/${primera.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: primera.id, titulo: primera.titulo });
    expect(res.body.descripcion).toBeTruthy();
  });

  it('CA3–CA4: el listado muestra estado y última actualización', async () => {
    const [primera] = (await norte.get('/api/solicitudes')).body.datos;
    expect(primera.estado).toBeTruthy();
    expect(new Date(primera.actualizadaEn).toString()).not.toBe('Invalid Date');
  });

  it('CA1: acceder por URL al detalle de una solicitud ajena responde 404 sin revelarla', async () => {
    const ajena = await ctx.prisma.solicitud.findFirst({ where: { solicitanteId: sur.usuario.id } });
    const res = await norte.get(`/api/solicitudes/${ajena.id}`);
    expect(res.status).toBe(404);
    expect(JSON.stringify(res.body)).not.toContain(ajena.titulo);
    expect((await norte.get('/api/solicitudes/999999')).body).toEqual(res.body);
  });

  it('Un identificador no numérico se rechaza con validación', async () => {
    expect((await norte.get('/api/solicitudes/abc')).status).toBe(400);
  });
});
