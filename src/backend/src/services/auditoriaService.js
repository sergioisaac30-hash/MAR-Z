import { formatCodigo } from '../domain/constantes.js';

/**
 * HU11 · Consulta del historial de auditoría en SOLO LECTURA. Este servicio no expone ninguna
 * operación de escritura; el actor se muestra codificado (nunca nombre ni correo).
 */
export function crearServicioAuditoria({ prisma }) {
  return {
    async listar({ accion, solicitudId, desde, hasta, pagina = 1, tamano = 25 } = {}) {
      const where = {
        ...(accion ? { accionId: accion } : {}),
        ...(solicitudId ? { solicitudId } : {}),
        ...(desde || hasta
          ? { creadoEn: { ...(desde ? { gte: new Date(`${desde}T00:00:00`) } : {}), ...(hasta ? { lte: new Date(`${hasta}T23:59:59.999`) } : {}) } }
          : {}),
      };
      const [total, filas, acciones] = await Promise.all([
        prisma.auditoria.count({ where }),
        prisma.auditoria.findMany({
          where,
          include: { accion: true, actor: { select: { codigoActor: true, rol: { select: { nombre: true } } } } },
          orderBy: [{ creadoEn: 'desc' }, { id: 'desc' }],
          skip: (pagina - 1) * tamano,
          take: tamano,
        }),
        prisma.accionAuditoria.findMany({ orderBy: { descripcion: 'asc' } }),
      ]);
      return {
        datos: filas.map((a) => ({
          id: a.id,
          fecha: a.creadoEn,
          actor: a.actor.codigoActor,
          rolActor: a.actor.rol.nombre,
          accion: a.accionId,
          descripcion: a.accion.descripcion,
          solicitud: a.solicitudId ? formatCodigo(a.solicitudId) : null,
          campo: a.campo,
          valorAnterior: a.valorAnterior,
          valorNuevo: a.valorNuevo,
        })),
        total,
        pagina,
        tamano,
        paginas: Math.max(1, Math.ceil(total / tamano)),
        acciones: acciones.map((a) => ({ codigo: a.codigo, descripcion: a.descripcion })),
      };
    },
  };
}
