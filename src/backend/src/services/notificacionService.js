import { notFound } from '../middleware/errorHandler.js';

// HU05 · Notificaciones dentro de la aplicación; cada usuario solo ve las suyas.
export function crearServicioNotificacion({ prisma }) {
  return {
    async listar(user) {
      const [datos, noLeidas] = await Promise.all([
        prisma.notificacion.findMany({
          where: { usuarioId: user.id },
          orderBy: { creadaEn: 'desc' },
          take: 20,
          select: { id: true, tipo: true, mensaje: true, solicitudId: true, creadaEn: true, leidaEn: true },
        }),
        prisma.notificacion.count({ where: { usuarioId: user.id, leidaEn: null } }),
      ]);
      return { datos, noLeidas };
    },

    async marcarLeida(user, id) {
      const propia = await prisma.notificacion.findFirst({ where: { id, usuarioId: user.id } });
      if (!propia) throw notFound('La notificación no existe.');
      if (!propia.leidaEn) await prisma.notificacion.update({ where: { id }, data: { leidaEn: new Date() } });
    },

    async marcarTodas(user) {
      await prisma.notificacion.updateMany({ where: { usuarioId: user.id, leidaEn: null }, data: { leidaEn: new Date() } });
    },
  };
}
