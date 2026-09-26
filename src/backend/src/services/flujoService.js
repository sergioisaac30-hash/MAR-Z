import { ACCIONES, ESTADOS, TIPO_CIERRE } from '../domain/constantes.js';
import { INCLUDE_SOLICITUD, buscarEnAlcance, formatearSolicitud, registrarAuditoria } from './solicitudService.js';
import { destinosPermitidos, exigirTransicion } from './transiciones.js';

function eventoDTO(a) {
  return {
    id: a.id,
    accion: a.accionId,
    descripcion: a.accion.descripcion,
    campo: a.campo,
    valorAnterior: a.valorAnterior,
    valorNuevo: a.valorNuevo,
    fecha: a.creadoEn,
    // Actor codificado: nunca el nombre ni el correo.
    actor: { codigo: a.actor.codigoActor, rol: a.actor.rol.nombre },
  };
}

// HU07 / HU08 · Flujo de estados de una solicitud.
export function crearServicioFlujo({ prisma }) {
  return {
    // Estados a los que el usuario puede llevar la solicitud desde su estado actual.
    async transiciones(user, id) {
      const solicitud = await buscarEnAlcance(prisma, user, id);
      return { estadoActual: solicitud.estadoId, destinos: await destinosPermitidos(prisma, solicitud.estadoId, user.rol) };
    },

    // HU07 · Solo transiciones registradas para el rol; cualquier otra se rechaza sin modificar nada.
    async cambiarEstado(user, id, destino) {
      return prisma.$transaction(async (tx) => {
        const solicitud = await buscarEnAlcance(tx, user, id);
        await exigirTransicion(tx, solicitud.estadoId, destino, user.rol);
        const ahora = new Date();
        const actualizada = await tx.solicitud.update({
          where: { id },
          data: { estadoId: destino, actualizadaEn: ahora },
          include: INCLUDE_SOLICITUD,
        });
        await registrarAuditoria(tx, {
          solicitudId: id,
          actorId: user.id,
          accion: ACCIONES.ESTADO_CAMBIADO,
          campo: 'estado',
          anterior: solicitud.estadoId,
          nuevo: destino,
          fecha: ahora,
        });
        return formatearSolicitud(actualizada, user);
      });
    },

    // HU08 · El solicitante acepta una solicitud "Resuelta": pasa a "Cerrada" y se fija la fecha de cierre.
    async confirmar(user, id) {
      return prisma.$transaction(async (tx) => {
        const solicitud = await buscarEnAlcance(tx, user, id);
        await exigirTransicion(tx, solicitud.estadoId, ESTADOS.CERRADA, user.rol);
        const ahora = new Date();
        const actualizada = await tx.solicitud.update({
          where: { id },
          data: { estadoId: ESTADOS.CERRADA, cerradaEn: ahora, actualizadaEn: ahora },
          include: INCLUDE_SOLICITUD,
        });
        await tx.cierre.create({ data: { solicitudId: id, tipo: TIPO_CIERRE.CONFIRMACION, actorId: user.id, creadoEn: ahora } });
        await registrarAuditoria(tx, {
          solicitudId: id,
          actorId: user.id,
          accion: ACCIONES.CONFIRMACION,
          campo: 'estado',
          anterior: solicitud.estadoId,
          nuevo: ESTADOS.CERRADA,
          fecha: ahora,
        });
        return formatearSolicitud(actualizada, user);
      });
    },

    // HU08 · El solicitante reabre una solicitud "Resuelta" indicando un motivo obligatorio.
    async reabrir(user, id, motivo) {
      return prisma.$transaction(async (tx) => {
        const solicitud = await buscarEnAlcance(tx, user, id);
        await exigirTransicion(tx, solicitud.estadoId, ESTADOS.REABIERTA, user.rol);
        const ahora = new Date();
        await tx.cierre.create({ data: { solicitudId: id, tipo: TIPO_CIERRE.REAPERTURA, motivo, actorId: user.id, creadoEn: ahora } });
        const actualizada = await tx.solicitud.update({
          where: { id },
          data: { estadoId: ESTADOS.REABIERTA, actualizadaEn: ahora },
          include: INCLUDE_SOLICITUD,
        });
        const base = { solicitudId: id, actorId: user.id, accion: ACCIONES.REAPERTURA, fecha: ahora };
        await registrarAuditoria(tx, { ...base, campo: 'estado', anterior: solicitud.estadoId, nuevo: ESTADOS.REABIERTA });
        // El motivo es la justificación de la decisión: se conserva para poder verificarla.
        await registrarAuditoria(tx, { ...base, campo: 'motivo', nuevo: motivo });
        return formatearSolicitud(actualizada, user);
      });
    },

    // Historial completo de la solicitud (quién, cuándo, qué campo, valor anterior y nuevo).
    async historial(user, id) {
      await buscarEnAlcance(prisma, user, id);
      const eventos = await prisma.auditoria.findMany({
        where: { solicitudId: id },
        include: { accion: true, actor: { select: { codigoActor: true, rol: { select: { nombre: true } } } } },
        orderBy: [{ creadoEn: 'asc' }, { id: 'asc' }],
      });
      return eventos.map(eventoDTO);
    },
  };
}
