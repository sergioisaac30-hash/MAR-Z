import { ACCIONES, ESTADOS, ESTADO_USUARIO, ROLES, TIPO_NOTIFICACION, formatCodigo } from '../domain/constantes.js';
import { badRequest, conflict } from '../middleware/errorHandler.js';
import { registrarAuditoria } from './solicitudService.js';
import { INCLUDE_SOLICITUD, buscarEnAlcance, formatearSolicitud } from './solicitudService.js';
import { exigirTransicion } from './transiciones.js';

// Estados en los que tiene sentido establecer o cambiar el agente responsable.
const ESTADOS_ASIGNABLES = [ESTADOS.NUEVO, ESTADOS.ASIGNADA, ESTADOS.EN_PROGRESO, ESTADOS.EN_ESPERA, ESTADOS.REABIERTA];
const AGENTE_ACTIVO = { estado: ESTADO_USUARIO.ACTIVO, rol: { codigo: ROLES.AGENTE } };

export function crearServicioAsignacion({ prisma }) {
  return {
    // HU05 · Solo se ofrecen agentes con estado Activo. No se expone el correo ni la carga de trabajo.
    agentesActivos() {
      return prisma.usuario.findMany({
        where: AGENTE_ACTIVO,
        select: { id: true, nombre: true, codigoActor: true },
        orderBy: { nombre: 'asc' },
      });
    },

    // HU05 · Asigna (o reasigna) la solicitud a un agente activo. Registra quién y cuándo,
    // pasa de "Nuevo" a "Asignada" en la primera asignación y notifica al agente en la app.
    async asignar(user, solicitudId, agenteId) {
      return prisma.$transaction(async (tx) => {
        const solicitud = await buscarEnAlcance(tx, user, solicitudId);
        if (!ESTADOS_ASIGNABLES.includes(solicitud.estadoId)) {
          throw conflict('ESTADO_NO_ASIGNABLE', `No se puede asignar una solicitud en estado "${solicitud.estadoId}".`);
        }
        const agente = await tx.usuario.findFirst({ where: { id: agenteId, ...AGENTE_ACTIVO } });
        if (!agente) {
          throw badRequest('AGENTE_NO_VALIDO', 'Solo puede asignarse a un agente con estado Activo.', [
            { campo: 'agenteId', mensaje: 'El usuario seleccionado no es un agente activo.' },
          ]);
        }
        const vigente = solicitud.asignaciones[0];
        if (vigente?.agenteId === agenteId) {
          throw conflict('SIN_CAMBIOS', 'La solicitud ya está asignada a ese agente.');
        }

        const ahora = new Date();
        const nuevoEstado = solicitud.estadoId === ESTADOS.NUEVO ? ESTADOS.ASIGNADA : solicitud.estadoId;
        if (nuevoEstado !== solicitud.estadoId) await exigirTransicion(tx, solicitud.estadoId, nuevoEstado, user.rol);

        if (vigente) await tx.asignacion.update({ where: { id: vigente.id }, data: { vigente: false } });
        await tx.asignacion.create({ data: { solicitudId, agenteId, asignadoPor: user.id, asignadoEn: ahora } });
        const actualizada = await tx.solicitud.update({
          where: { id: solicitudId },
          data: { estadoId: nuevoEstado, actualizadaEn: ahora },
          include: INCLUDE_SOLICITUD,
        });

        const base = { solicitudId, actorId: user.id, fecha: ahora };
        await registrarAuditoria(tx, {
          ...base,
          accion: ACCIONES.ASIGNACION,
          campo: 'agente_asignado',
          anterior: vigente?.agente.codigoActor,
          nuevo: agente.codigoActor,
        });
        if (nuevoEstado !== solicitud.estadoId) {
          await registrarAuditoria(tx, { ...base, accion: ACCIONES.ESTADO_CAMBIADO, campo: 'estado', anterior: solicitud.estadoId, nuevo: nuevoEstado });
        }
        await tx.notificacion.create({
          data: {
            usuarioId: agenteId,
            solicitudId,
            tipo: TIPO_NOTIFICACION.ASIGNACION,
            mensaje: `Se le asignó la solicitud ${formatCodigo(solicitudId)}: ${solicitud.titulo}`,
            creadaEn: ahora,
          },
        });
        return formatearSolicitud(actualizada, user);
      });
    },
  };
}
