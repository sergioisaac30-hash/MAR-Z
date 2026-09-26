import { ACCIONES } from '../domain/constantes.js';
import { conflict } from '../middleware/errorHandler.js';
import { buscarEnAlcance, registrarAuditoria } from './solicitudService.js';

const INCLUDE_AUTOR = { autor: { select: { nombre: true, codigoActor: true, rol: { select: { nombre: true } } } } };

function comentarioDTO(c) {
  return {
    id: c.id,
    contenido: c.contenido,
    creadoEn: c.creadoEn,
    autor: { nombre: c.autor.nombre, codigoActor: c.autor.codigoActor, rol: c.autor.rol.nombre },
  };
}

// HU06 · Comentarios de trabajo. No existe operación de edición ni borrado: autor, fecha y
// contenido son inmutables (lo impiden también el cliente Prisma y los triggers).
export function crearServicioComentario({ prisma }) {
  return {
    // Visibles para los roles autorizados sobre la solicitud: solicitante propietario, agente asignado y coordinador.
    async listar(user, solicitudId) {
      await buscarEnAlcance(prisma, user, solicitudId);
      const filas = await prisma.comentario.findMany({
        where: { solicitudId },
        include: INCLUDE_AUTOR,
        orderBy: [{ creadoEn: 'asc' }, { id: 'asc' }],
      });
      return filas.map(comentarioDTO);
    },

    // Solo el agente asignado (ruta + alcance). El autor y la fecha los fija el servidor.
    async crear(user, solicitudId, contenido) {
      return prisma.$transaction(async (tx) => {
        const solicitud = await buscarEnAlcance(tx, user, solicitudId);
        if (solicitud.estado.esFinal) {
          throw conflict('SOLICITUD_CERRADA', 'No se pueden registrar comentarios en una solicitud cerrada.');
        }
        const ahora = new Date();
        const comentario = await tx.comentario.create({
          data: { solicitudId, autorId: user.id, contenido, creadoEn: ahora },
          include: INCLUDE_AUTOR,
        });
        await tx.solicitud.update({ where: { id: solicitudId }, data: { actualizadaEn: ahora } });
        // Auditoría proporcional: se registra el evento, no el texto del comentario.
        await registrarAuditoria(tx, {
          solicitudId,
          actorId: user.id,
          accion: ACCIONES.COMENTARIO_REGISTRADO,
          campo: 'comentario',
          nuevo: `Comentario #${comentario.id}`,
          fecha: ahora,
        });
        return comentarioDTO(comentario);
      });
    },
  };
}
