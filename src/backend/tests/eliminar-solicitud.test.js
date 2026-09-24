// Eliminar solicitud (borrado lógico, auditado)
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearContexto } from './helpers/context.js';

let ctx;
let norte;
let sur;
let coordinador;
beforeAll(async () => {
  ctx = await crearContexto();
  norte = await ctx.comoUsuario('solNorte');
  sur = await ctx.comoUsuario('solSur');
  coordinador = await ctx.comoUsuario('coordinador');
});
afterAll(() => ctx.cerrar());

describe('Eliminar solicitud', () => {
  it('el solicitante elimina una solicitud propia en estado Nuevo (204) y deja de verse', async () => {
    const solicitud = await ctx.prisma.solicitud.findFirst({ where: { solicitanteId: norte.usuario.id, estadoId: 'Nuevo' } });
    const res = await norte.delete(`/api/solicitudes/${solicitud.id}`);
    expect(res.status).toBe(204);

    const lista = await norte.get('/api/solicitudes');
    expect(lista.body.datos.map((s) => s.id)).not.toContain(solicitud.id);

    const detalle = await norte.get(`/api/solicitudes/${solicitud.id}`);
    expect(detalle.status).toBe(404);
  });

  it('el solicitante no puede eliminar una solicitud ajena (404)', async () => {
    const ajena = await ctx.prisma.solicitud.findFirst({ where: { solicitanteId: sur.usuario.id, eliminadaEn: null } });
    const res = await norte.delete(`/api/solicitudes/${ajena.id}`);
    expect(res.status).toBe(404);
    const bd = await ctx.prisma.solicitud.findUnique({ where: { id: ajena.id } });
    expect(bd.eliminadaEn).toBeNull();
  });

  it('el solicitante no puede eliminar una solicitud propia que ya no está en estado Nuevo (409)', async () => {
    const solicitud = await ctx.prisma.solicitud.findFirst({ where: { solicitanteId: norte.usuario.id, eliminadaEn: null } });
    await ctx.prisma.solicitud.update({ where: { id: solicitud.id }, data: { estadoId: 'Asignada' } });

    const res = await norte.delete(`/api/solicitudes/${solicitud.id}`);
    expect(res.status).toBe(409);
    expect(res.body.error.codigo).toBe('NO_SE_PUEDE_ELIMINAR');
    const bd = await ctx.prisma.solicitud.findUnique({ where: { id: solicitud.id } });
    expect(bd.eliminadaEn).toBeNull();
  });

  it('el coordinador puede eliminar cualquier solicitud no eliminada', async () => {
    const solicitud = await ctx.prisma.solicitud.findFirst({ where: { solicitanteId: sur.usuario.id, eliminadaEn: null } });
    const res = await coordinador.delete(`/api/solicitudes/${solicitud.id}`);
    expect(res.status).toBe(204);
    const bd = await ctx.prisma.solicitud.findUnique({ where: { id: solicitud.id } });
    expect(bd.eliminadaEn).not.toBeNull();
    expect(bd.eliminadaPor).toBe(coordinador.usuario.id);
  });

  it('agente y auditor no pueden eliminar solicitudes (403)', async () => {
    const solicitud = await ctx.prisma.solicitud.findFirst({ where: { eliminadaEn: null } });
    for (const clave of ['agente1', 'auditor']) {
      const usuario = await ctx.comoUsuario(clave);
      const res = await usuario.delete(`/api/solicitudes/${solicitud.id}`);
      expect(res.status).toBe(403);
    }
    const bd = await ctx.prisma.solicitud.findUnique({ where: { id: solicitud.id } });
    expect(bd.eliminadaEn).toBeNull();
  });

  it('queda un registro de auditoría con el actor', async () => {
    const solicitud = await ctx.prisma.solicitud.findFirst({ where: { solicitanteId: norte.usuario.id, estadoId: 'Nuevo', eliminadaEn: null } });
    const res = await norte.delete(`/api/solicitudes/${solicitud.id}`);
    expect(res.status).toBe(204);

    const evento = await ctx.prisma.auditoria.findFirst({
      where: { solicitudId: solicitud.id, accionId: 'SOLICITUD_ELIMINADA' },
      orderBy: { id: 'desc' },
    });
    expect(evento).toMatchObject({ actorId: norte.usuario.id, valorNuevo: 'Eliminada' });
  });

  it('eliminar dos veces la misma solicitud responde 404 la segunda vez', async () => {
    const solicitud = await ctx.prisma.solicitud.findFirst({ where: { solicitanteId: norte.usuario.id, estadoId: 'Nuevo', eliminadaEn: null } });
    expect((await norte.delete(`/api/solicitudes/${solicitud.id}`)).status).toBe(204);
    expect((await norte.delete(`/api/solicitudes/${solicitud.id}`)).status).toBe(404);
  });

  it('sin la cabecera anti-CSRF la petición se rechaza (403)', async () => {
    const solicitud = await ctx.prisma.solicitud.findFirst({ where: { solicitanteId: norte.usuario.id, eliminadaEn: null } });
    const res = await norte.agent.delete(`/api/solicitudes/${solicitud.id}`);
    expect(res.status).toBe(403);
    const bd = await ctx.prisma.solicitud.findUnique({ where: { id: solicitud.id } });
    expect(bd.eliminadaEn).toBeNull();
  });

  it('la prioridad no se puede cambiar en una solicitud eliminada (404)', async () => {
    const solicitud = await ctx.prisma.solicitud.findFirst({ where: { eliminadaEn: { not: null } } });
    const res = await coordinador.patch(`/api/solicitudes/${solicitud.id}/prioridad`, { prioridad: 'Alta' });
    expect(res.status).toBe(404);
  });
});
