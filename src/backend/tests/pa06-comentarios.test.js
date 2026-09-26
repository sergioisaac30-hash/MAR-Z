// PA-06 · HU06 Registrar comentarios
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearContexto } from './helpers/context.js';

let ctx;
let coordinador;
let agente1;
let agente2;
let solNorte;
let solSur;
let solicitud;
beforeAll(async () => {
  ctx = await crearContexto();
  coordinador = await ctx.comoUsuario('coordinador');
  agente1 = await ctx.comoUsuario('agente1');
  agente2 = await ctx.comoUsuario('agente2');
  solNorte = await ctx.comoUsuario('solNorte');
  solSur = await ctx.comoUsuario('solSur');
  solicitud = await ctx.prisma.solicitud.findFirst({ where: { solicitanteId: solNorte.usuario.id, estadoId: 'Nuevo' } });
  await coordinador.post(`/api/solicitudes/${solicitud.id}/asignacion`, { agenteId: agente1.usuario.id });
});
afterAll(() => ctx.cerrar());

const url = () => `/api/solicitudes/${solicitud.id}/comentarios`;

describe('PA-06 · HU06 Registrar comentarios', () => {
  it('CA1: el comentario no puede estar vacío', async () => {
    for (const contenido of ['', '    ', undefined]) {
      const res = await agente1.post(url(), { contenido });
      expect(res.status).toBe(400);
      expect(res.body.error.detalles[0].campo).toBe('contenido');
    }
  });

  it('CA2: autor y fecha los fija el servidor (el cliente no puede imponerlos)', async () => {
    const antes = Date.now();
    const res = await agente1.post(url(), { contenido: 'Se revisó el cableado del rack.', autorId: solNorte.usuario.id, creadoEn: '2000-01-01T00:00:00Z' });
    expect(res.status).toBe(201);
    expect(res.body.autor).toMatchObject({ codigoActor: agente1.usuario.codigoActor, rol: 'Agente' });
    expect(new Date(res.body.creadoEn).getTime()).toBeGreaterThanOrEqual(antes - 1000);
    const bd = await ctx.prisma.comentario.findUnique({ where: { id: res.body.id } });
    expect(bd.autorId).toBe(agente1.usuario.id);
  });

  it('CA2/CA4: no existe forma de editar ni borrar un comentario', async () => {
    const [c] = (await agente1.get(url())).body.datos;
    for (const metodo of ['patch', 'put']) {
      expect((await agente1[metodo](`${url()}/${c.id}`, { contenido: 'editado' })).status).toBe(404);
    }
    expect((await agente1.delete(`${url()}/${c.id}`)).status).toBe(404);
    expect((await coordinador.delete(`${url()}/${c.id}`)).status).toBe(404);
    // Tampoco a nivel de código ni de base de datos.
    await expect(ctx.prisma.comentario.update({ where: { id: c.id }, data: { contenido: 'x' } })).rejects.toThrow(/no pueden modificarse/);
    await expect(ctx.prisma.comentario.delete({ where: { id: c.id } })).rejects.toThrow(/no pueden modificarse/);
    await expect(ctx.prisma.$executeRawUnsafe(`UPDATE comentarios SET contenido = 'x' WHERE id = ${c.id}`)).rejects.toMatchObject({ meta: { message: 'COMENTARIO_INMUTABLE' } });
    await expect(ctx.prisma.$executeRawUnsafe(`DELETE FROM comentarios WHERE id = ${c.id}`)).rejects.toMatchObject({ meta: { message: 'COMENTARIO_INMUTABLE' } });
    expect((await ctx.prisma.comentario.findUnique({ where: { id: c.id } })).contenido).toBe(c.contenido);
  });

  it('CA3: visible para el solicitante propietario, el agente asignado y el coordinador', async () => {
    for (const usuario of [solNorte, agente1, coordinador]) {
      const res = await usuario.get(url());
      expect(res.status).toBe(200);
      expect(res.body.datos.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('CA3: no visible para otro solicitante, otro agente ni el auditor', async () => {
    expect((await solSur.get(url())).status).toBe(404);
    expect((await agente2.get(url())).status).toBe(404);
    const auditor = await ctx.comoUsuario('auditor');
    expect((await auditor.get(url())).status).toBe(403);
  });

  it('Solo el agente asignado registra comentarios de trabajo', async () => {
    expect((await solNorte.post(url(), { contenido: 'hola' })).status).toBe(403);
    expect((await coordinador.post(url(), { contenido: 'hola' })).status).toBe(403);
    expect((await agente2.post(url(), { contenido: 'hola' })).status).toBe(404);
  });

  it('El comentario queda en auditoría sin copiar su texto y actualiza la solicitud', async () => {
    const antes = await ctx.prisma.solicitud.findUnique({ where: { id: solicitud.id } });
    const res = await agente1.post(url(), { contenido: 'Texto de trabajo que no debe copiarse a auditoría.' });
    const evento = await ctx.prisma.auditoria.findFirst({ where: { solicitudId: solicitud.id, accionId: 'COMENTARIO_REGISTRADO' }, orderBy: { id: 'desc' } });
    expect(evento).toMatchObject({ actorId: agente1.usuario.id, campo: 'comentario', valorNuevo: `Comentario #${res.body.id}` });
    const despues = await ctx.prisma.solicitud.findUnique({ where: { id: solicitud.id } });
    expect(despues.actualizadaEn.getTime()).toBeGreaterThan(antes.actualizadaEn.getTime());
  });
});
