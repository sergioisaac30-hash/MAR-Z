import { ACCIONES, ESTADOS, ROLES, formatCodigo } from '../domain/constantes.js';
import { badRequest, conflict, notFound } from '../middleware/errorHandler.js';

export const INCLUDE_SOLICITUD = {
  categoria: { select: { id: true, nombre: true } },
  estado: { select: { codigo: true, esFinal: true } },
  solicitante: { select: { id: true, nombre: true } },
};

const ORDENES = {
  prioridad: (dir) => [{ prioridad: { orden: dir } }, { creadaEn: 'desc' }],
  estado: (dir) => [{ estado: { orden: dir } }, { creadaEn: 'desc' }],
  fecha: (dir) => [{ creadaEn: dir }, { id: dir }],
};

// Guarda un cambio en el historial de auditoría.
// Siempre se llama dentro de la misma transacción del cambio, para que nunca falte el registro.
export function registrarAuditoria(tx, { solicitudId = null, actorId, accion, campo, anterior = null, nuevo = null, fecha }) {
  return tx.auditoria.create({
    data: {
      solicitudId,
      actorId,
      accionId: accion,
      campo,
      valorAnterior: anterior === null || anterior === undefined ? null : String(anterior),
      valorNuevo: nuevo === null || nuevo === undefined ? null : String(nuevo),
      ...(fecha ? { creadoEn: fecha } : {}),
    },
  });
}

/*
 * Qué solicitudes puede ver cada rol:
 * - SOLICITANTE: solo las suyas (HU03).
 * - COORDINADOR: todas (HU04).
 * - AGENTE / AUDITOR: ninguna (llega en próximos sprints).
 */
export function filtroPorRol(user) {
  switch (user.rol) {
    case ROLES.SOLICITANTE:
      return { solicitanteId: user.id, eliminadaEn: null };
    case ROLES.COORDINADOR:
      return { eliminadaEn: null };
    default:
      return { id: -1 };
  }
}

// Convierte una solicitud de la base de datos en la forma que se envía al frontend.
export function formatearSolicitud(s, user) {
  return {
    id: s.id,
    codigo: formatCodigo(s.id),
    titulo: s.titulo,
    descripcion: s.descripcion,
    categoria: s.categoria,
    prioridad: s.prioridadId,
    estado: s.estadoId,
    esFinal: s.estado?.esFinal ?? false,
    // El nombre del solicitante solo se muestra a quien gestiona la solicitud.
    solicitante: user.rol === ROLES.SOLICITANTE ? { id: s.solicitante.id, nombre: 'Tú' } : s.solicitante,
    creadaEn: s.creadaEn,
    actualizadaEn: s.actualizadaEn,
    cerradaEn: s.cerradaEn,
  };
}

// Busca la solicitud si el usuario tiene acceso a ella; si no, responde 404 (no dice que existe).
export async function buscarEnAlcance(client, user, id) {
  const solicitud = await client.solicitud.findFirst({ where: { id, ...filtroPorRol(user) }, include: INCLUDE_SOLICITUD });
  if (!solicitud) throw notFound('La solicitud no existe o no tiene acceso a ella.');
  return solicitud;
}

// Trae las categorías, prioridades y estados que usa el formulario de solicitudes.
export function crearServicioCatalogo({ prisma }) {
  return {
    async obtener() {
      const [categorias, prioridades, estados] = await Promise.all([
        prisma.categoria.findMany({ where: { activa: true }, orderBy: { nombre: 'asc' }, select: { id: true, nombre: true } }),
        prisma.prioridad.findMany({ orderBy: { orden: 'asc' } }),
        prisma.estado.findMany({ orderBy: { orden: 'asc' } }),
      ]);
      return {
        categorias,
        prioridades: prioridades.map((p) => p.codigo),
        estados: estados.map((e) => ({ codigo: e.codigo, esFinal: e.esFinal })),
      };
    },
  };
}

export function crearServicioSolicitud({ prisma }) {
  async function validarCategoria(client, categoriaId) {
    const categoria = await client.categoria.findFirst({ where: { id: categoriaId, activa: true } });
    if (!categoria) {
      throw badRequest('VALIDACION', 'Los datos enviados no son válidos.', [
        { campo: 'categoriaId', mensaje: 'Seleccione una categoría válida.' },
      ]);
    }
  }

  return {
    // HU02 · El id, la fecha, el estado "Nuevo" y el dueño los pone el sistema.
    async crear(user, datos) {
      return prisma.$transaction(async (tx) => {
        await validarCategoria(tx, datos.categoriaId);
        const ahora = new Date();
        const creada = await tx.solicitud.create({
          data: {
            titulo: datos.titulo,
            descripcion: datos.descripcion,
            categoriaId: datos.categoriaId,
            prioridadId: datos.prioridad,
            estadoId: ESTADOS.NUEVO,
            solicitanteId: user.id,
            creadaEn: ahora,
            actualizadaEn: ahora,
          },
          include: INCLUDE_SOLICITUD,
        });
        const base = { solicitudId: creada.id, actorId: user.id, accion: ACCIONES.SOLICITUD_CREADA, fecha: ahora };
        await registrarAuditoria(tx, { ...base, campo: 'estado', nuevo: ESTADOS.NUEVO });
        await registrarAuditoria(tx, { ...base, campo: 'prioridad', nuevo: creada.prioridadId });
        return formatearSolicitud(creada, user);
      });
    },

    // HU03 / HU04 · Lista según el rol, se puede ordenar por prioridad, estado o fecha.
    async listar(user, { orden = 'fecha', dir = 'desc' } = {}) {
      const filas = await prisma.solicitud.findMany({
        where: filtroPorRol(user),
        include: INCLUDE_SOLICITUD,
        orderBy: ORDENES[orden](dir),
      });
      return filas.map((s) => formatearSolicitud(s, user));
    },

    // HU03 · Detalle de una solicitud; fuera de alcance responde 404.
    async obtener(user, id) {
      return formatearSolicitud(await buscarEnAlcance(prisma, user, id), user);
    },

    // HU04 · Solo el coordinador (se valida en la ruta). El cambio queda auditado.
    async cambiarPrioridad(user, id, { prioridad }) {
      return prisma.$transaction(async (tx) => {
        const actual = await buscarEnAlcance(tx, user, id);
        if (actual.estado.esFinal) {
          throw conflict('SOLICITUD_CERRADA', 'No se puede cambiar la prioridad de una solicitud cerrada.');
        }
        if (actual.prioridadId === prioridad) {
          throw conflict('SIN_CAMBIOS', `La solicitud ya tiene prioridad ${prioridad}.`);
        }

        const ahora = new Date();
        const actualizada = await tx.solicitud.update({
          where: { id },
          data: { prioridadId: prioridad, actualizadaEn: ahora },
          include: INCLUDE_SOLICITUD,
        });
        await registrarAuditoria(tx, {
          solicitudId: id,
          actorId: user.id,
          accion: ACCIONES.PRIORIDAD_CAMBIADA,
          campo: 'prioridad',
          anterior: actual.prioridadId,
          nuevo: prioridad,
          fecha: ahora,
        });
        return formatearSolicitud(actualizada, user);
      });
    },

    // Eliminar solicitud (borrado lógico, auditado).
    // SOLICITANTE: solo las propias y solo en estado Nuevo. COORDINADOR: cualquiera no eliminada.
    async eliminar(user, id) {
      return prisma.$transaction(async (tx) => {
        const actual = await buscarEnAlcance(tx, user, id);
        if (user.rol === ROLES.SOLICITANTE && actual.estadoId !== ESTADOS.NUEVO) {
          throw conflict('NO_SE_PUEDE_ELIMINAR', 'Solo se pueden eliminar solicitudes en estado Nuevo.');
        }

        const ahora = new Date();
        await tx.solicitud.update({
          where: { id },
          data: { eliminadaEn: ahora, eliminadaPor: user.id },
        });
        await registrarAuditoria(tx, {
          solicitudId: id,
          actorId: user.id,
          accion: ACCIONES.SOLICITUD_ELIMINADA,
          campo: 'estado',
          anterior: actual.estadoId,
          nuevo: 'Eliminada',
          fecha: ahora,
        });
      });
    },
  };
}
