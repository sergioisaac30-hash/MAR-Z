import bcrypt from 'bcryptjs';
import { ACCIONES, ESTADOS, ESTADO_USUARIO, TIPO_CIERRE, TIPO_NOTIFICACION, formatCodigo } from '../domain/constantes.js';
import { registrarAuditoria } from '../services/solicitudService.js';
import { fechaADate, hoyLocal } from '../utils/fechas.js';

/**
 * Datos semilla SOLO para pruebas y demostración.
 * Todos los nombres, correos y textos son ficticios (dominio reservado .test).
 */
export const PASSWORD_DEMO = 'Mesa2026!';

export const USUARIOS_DEMO = [
  { clave: 'solNorte', codigoActor: 'ACT-S7N2', nombre: 'Solicitante Sitio Norte', email: 'solicitante.norte@mesa.test', rolId: 1 },
  { clave: 'solSur', codigoActor: 'ACT-S4R8', nombre: 'Solicitante Sitio Sur', email: 'solicitante.sur@mesa.test', rolId: 1 },
  { clave: 'agente1', codigoActor: 'ACT-A1K5', nombre: 'Agente Soporte Uno', email: 'agente.uno@mesa.test', rolId: 2 },
  { clave: 'agente2', codigoActor: 'ACT-A9P3', nombre: 'Agente Soporte Dos', email: 'agente.dos@mesa.test', rolId: 2 },
  // Quedó inactivo: no puede iniciar sesión.
  { clave: 'agenteInactivo', codigoActor: 'ACT-A6X0', nombre: 'Agente Soporte Tres', email: 'agente.tres@mesa.test', rolId: 2, estado: 'Inactivo' },
  { clave: 'coordinador', codigoActor: 'ACT-C2M7', nombre: 'Coordinación Central', email: 'coordinador@mesa.test', rolId: 3 },
  { clave: 'auditor', codigoActor: 'ACT-D5Q1', nombre: 'Auditoría Interna', email: 'auditor@mesa.test', rolId: 4 },
];

const DIA = 24 * 3600 * 1000;
const hace = (dias) => new Date(Date.now() - dias * DIA);
const dentroDe = (dias) => hoyLocal(new Date(Date.now() + dias * DIA));

// Solicitudes semilla: dueño, categoría (posición en el catálogo), prioridad y antigüedad.
// Las de prioridad Alta llevan justificación y fecha objetivo (CAM-01 las exige).
const SOLICITUDES_DEMO = [
  { sol: 'solNorte', cat: 1, prioridad: 'Media', dias: 1.2, titulo: 'Lector de códigos no responde en muelle 3', descripcion: 'El lector inalámbrico del muelle 3 no registra lecturas desde el cambio de turno. Se reinició sin éxito.' },
  { sol: 'solNorte', cat: 2, prioridad: 'Alta', dias: 0.4, titulo: 'Sin conexión en oficina de despacho', descripcion: 'Los equipos de la oficina de despacho no tienen acceso a la red interna. Afecta la emisión de guías.', justificacionPrioridad: 'Detiene la emisión de guías de despacho.', fechaObjetivo: dentroDe(1) },
  { sol: 'solNorte', cat: 5, prioridad: 'Baja', dias: 3.5, titulo: 'Impresora de etiquetas imprime desalineado', descripcion: 'Las etiquetas de la impresora de la línea 2 salen corridas hacia la derecha aproximadamente 3 mm.' },
  { sol: 'solNorte', cat: 6, prioridad: 'Baja', dias: 10, titulo: 'Aire acondicionado del cuarto de servidores ruidoso', descripcion: 'El equipo de aire acondicionado del cuarto de servidores produce un ruido fuerte desde el lunes.' },
  { sol: 'solSur', cat: 3, prioridad: 'Media', dias: 2.1, titulo: 'Error al cerrar inventario diario', descripcion: 'La aplicación de inventario muestra un error al confirmar el cierre diario del almacén sur.' },
  { sol: 'solSur', cat: 4, prioridad: 'Alta', dias: 0.8, titulo: 'Alta de acceso para nuevo turno', descripcion: 'Se requiere habilitar acceso a la aplicación de recepción para el personal del turno nocturno.', justificacionPrioridad: 'El turno nocturno queda sin registrar recepciones.', fechaObjetivo: dentroDe(2) },
  { sol: 'solSur', cat: 6, prioridad: 'Baja', dias: 5.3, titulo: 'Toma eléctrica dañada en área de carga', descripcion: 'Una toma eléctrica del área de carga presenta falso contacto; se usa para cargar terminales portátiles.' },
  { sol: 'solSur', cat: 2, prioridad: 'Media', dias: 3, titulo: 'Caída de enlace en sitio sur', descripcion: 'El enlace principal del sitio sur se cae varias veces al día durante algunos minutos.' },
];

// Crea una solicitud semilla y deja su registro de auditoría de creación.
async function crearSolicitud(tx, usuarios, categorias, def) {
  const creadaEn = hace(def.dias);
  const solicitud = await tx.solicitud.create({
    data: {
      titulo: def.titulo,
      descripcion: def.descripcion,
      categoriaId: categorias[def.cat - 1].id,
      prioridadId: def.prioridad,
      justificacionPrioridad: def.justificacionPrioridad ?? null,
      fechaObjetivo: fechaADate(def.fechaObjetivo ?? null),
      estadoId: ESTADOS.NUEVO,
      solicitanteId: usuarios[def.sol].id,
      creadaEn,
      actualizadaEn: creadaEn,
    },
  });
  const base = { solicitudId: solicitud.id, actorId: usuarios[def.sol].id, accion: ACCIONES.SOLICITUD_CREADA, fecha: creadaEn };
  await registrarAuditoria(tx, { ...base, campo: 'estado', nuevo: ESTADOS.NUEVO });
  await registrarAuditoria(tx, { ...base, campo: 'prioridad', nuevo: def.prioridad });
  if (def.justificacionPrioridad) {
    await registrarAuditoria(tx, { ...base, campo: 'justificacion_prioridad', nuevo: def.justificacionPrioridad });
    await registrarAuditoria(tx, { ...base, campo: 'fecha_objetivo', nuevo: def.fechaObjetivo });
  }
  return solicitud;
}

// HU05 · Asigna una solicitud semilla a un agente y avanza "Nuevo" a "Asignada".
async function asignarSemilla(tx, solicitud, agente, coordinador, ahora) {
  await tx.asignacion.create({ data: { solicitudId: solicitud.id, agenteId: agente.id, asignadoPor: coordinador.id, asignadoEn: ahora } });
  const estadoId = solicitud.estadoId === ESTADOS.NUEVO ? ESTADOS.ASIGNADA : solicitud.estadoId;
  const actualizada = await tx.solicitud.update({ where: { id: solicitud.id }, data: { estadoId, actualizadaEn: ahora } });
  const base = { solicitudId: solicitud.id, actorId: coordinador.id, fecha: ahora };
  await registrarAuditoria(tx, { ...base, accion: ACCIONES.ASIGNACION, campo: 'agente_asignado', nuevo: agente.codigoActor });
  await registrarAuditoria(tx, { ...base, accion: ACCIONES.ESTADO_CAMBIADO, campo: 'estado', anterior: solicitud.estadoId, nuevo: estadoId });
  await tx.notificacion.create({
    data: {
      usuarioId: agente.id,
      solicitudId: solicitud.id,
      tipo: TIPO_NOTIFICACION.ASIGNACION,
      mensaje: `Se le asignó la solicitud ${formatCodigo(solicitud.id)}: ${solicitud.titulo}`,
      creadaEn: ahora,
      leidaEn: null,
    },
  });
  return actualizada;
}

// HU07 · Cambia el estado de una solicitud semilla y lo deja auditado.
async function cambiarEstadoSemilla(tx, solicitud, destino, agente, ahora) {
  const actualizada = await tx.solicitud.update({ where: { id: solicitud.id }, data: { estadoId: destino, actualizadaEn: ahora } });
  await registrarAuditoria(tx, {
    solicitudId: solicitud.id,
    actorId: agente.id,
    accion: ACCIONES.ESTADO_CAMBIADO,
    campo: 'estado',
    anterior: solicitud.estadoId,
    nuevo: destino,
    fecha: ahora,
  });
  return actualizada;
}

// HU06 · Registra un comentario de trabajo del agente asignado.
async function comentarSemilla(tx, solicitud, agente, contenido, ahora) {
  const comentario = await tx.comentario.create({ data: { solicitudId: solicitud.id, autorId: agente.id, contenido, creadoEn: ahora } });
  await tx.solicitud.update({ where: { id: solicitud.id }, data: { actualizadaEn: ahora } });
  await registrarAuditoria(tx, {
    solicitudId: solicitud.id,
    actorId: agente.id,
    accion: ACCIONES.COMENTARIO_REGISTRADO,
    campo: 'comentario',
    nuevo: `Comentario #${comentario.id}`,
    fecha: ahora,
  });
}

// HU08 · Confirma una solicitud "Resuelta": pasa a "Cerrada" con fecha de cierre.
async function confirmarSemilla(tx, solicitud, solicitante, ahora) {
  const actualizada = await tx.solicitud.update({ where: { id: solicitud.id }, data: { estadoId: ESTADOS.CERRADA, cerradaEn: ahora, actualizadaEn: ahora } });
  await tx.cierre.create({ data: { solicitudId: solicitud.id, tipo: TIPO_CIERRE.CONFIRMACION, actorId: solicitante.id, creadoEn: ahora } });
  await registrarAuditoria(tx, {
    solicitudId: solicitud.id,
    actorId: solicitante.id,
    accion: ACCIONES.CONFIRMACION,
    campo: 'estado',
    anterior: solicitud.estadoId,
    nuevo: ESTADOS.CERRADA,
    fecha: ahora,
  });
  return actualizada;
}

// HU08 · Reabre una solicitud "Resuelta" con un motivo obligatorio.
async function reabrirSemilla(tx, solicitud, solicitante, motivo, ahora) {
  await tx.cierre.create({ data: { solicitudId: solicitud.id, tipo: TIPO_CIERRE.REAPERTURA, motivo, actorId: solicitante.id, creadoEn: ahora } });
  const actualizada = await tx.solicitud.update({ where: { id: solicitud.id }, data: { estadoId: ESTADOS.REABIERTA, actualizadaEn: ahora } });
  const base = { solicitudId: solicitud.id, actorId: solicitante.id, accion: ACCIONES.REAPERTURA, fecha: ahora };
  await registrarAuditoria(tx, { ...base, campo: 'estado', anterior: solicitud.estadoId, nuevo: ESTADOS.REABIERTA });
  await registrarAuditoria(tx, { ...base, campo: 'motivo', nuevo: motivo });
  return actualizada;
}

/**
 * Sprint 2 · deja un pequeño historial ficticio: solicitudes en distintos estados,
 * asignaciones, comentarios, una reapertura, una confirmación y notificaciones.
 * Algunas solicitudes quedan "Nuevo" sin asignar para poder seguir probando HU05.
 */
async function avanzarFlujoSemilla(prisma, usuarios, solicitudes) {
  const { agente1, agente2, coordinador, solSur } = usuarios;

  // Lector de códigos (solNorte): asignada y en progreso, con un comentario del agente.
  await prisma.$transaction(async (tx) => {
    let s = await asignarSemilla(tx, solicitudes[0], agente1, coordinador, hace(1));
    s = await cambiarEstadoSemilla(tx, s, ESTADOS.EN_PROGRESO, agente1, hace(0.9));
    await comentarSemilla(tx, s, agente1, 'Se revisó el lector y se reemplazó la batería; se deja en observación.', hace(0.8));
  });

  // Error al cerrar inventario (solSur): asignada, en progreso y puesta en espera.
  await prisma.$transaction(async (tx) => {
    let s = await asignarSemilla(tx, solicitudes[4], agente2, coordinador, hace(1.8));
    s = await cambiarEstadoSemilla(tx, s, ESTADOS.EN_PROGRESO, agente2, hace(1.7));
    await cambiarEstadoSemilla(tx, s, ESTADOS.EN_ESPERA, agente2, hace(1.5));
  });

  // Alta de acceso (solSur, prioridad Alta): resuelta y confirmada por el solicitante.
  await prisma.$transaction(async (tx) => {
    let s = await asignarSemilla(tx, solicitudes[5], agente1, coordinador, hace(0.7));
    s = await cambiarEstadoSemilla(tx, s, ESTADOS.EN_PROGRESO, agente1, hace(0.6));
    s = await cambiarEstadoSemilla(tx, s, ESTADOS.RESUELTA, agente1, hace(0.3));
    await confirmarSemilla(tx, s, solSur, hace(0.1));
  });

  // Toma eléctrica dañada (solSur): resuelta, pero el solicitante la reabre con motivo.
  await prisma.$transaction(async (tx) => {
    let s = await asignarSemilla(tx, solicitudes[6], agente2, coordinador, hace(4.5));
    s = await cambiarEstadoSemilla(tx, s, ESTADOS.EN_PROGRESO, agente2, hace(4));
    s = await cambiarEstadoSemilla(tx, s, ESTADOS.RESUELTA, agente2, hace(2));
    await reabrirSemilla(tx, s, solSur, 'La toma volvió a fallar al conectar un cargador.', hace(1));
  });
}

// Inserta usuarios y, si se pide, solicitudes de demostración; no hace nada si ya hay usuarios.
// El seed de la aplicación solo crea usuarios; las pruebas automáticas cargan también solicitudes.
export async function seedDemo(prisma, { rounds = 12, conSolicitudes = true } = {}) {
  if ((await prisma.usuario.count()) > 0) return { omitido: true };

  const passwordHash = await bcrypt.hash(PASSWORD_DEMO, rounds);
  const usuarios = {};
  // Todos se crean activos; al final se marca inactivo el que corresponde.
  for (const { clave, estado: _estado, ...datos } of USUARIOS_DEMO) {
    usuarios[clave] = await prisma.usuario.create({ data: { ...datos, passwordHash } });
  }
  const categorias = await prisma.categoria.findMany({ orderBy: { id: 'asc' } });

  const solicitudes = [];
  for (const def of conSolicitudes ? SOLICITUDES_DEMO : []) {
    solicitudes.push(await prisma.$transaction((tx) => crearSolicitud(tx, usuarios, categorias, def)));
  }

  for (const { clave, estado } of USUARIOS_DEMO.filter((d) => d.estado === ESTADO_USUARIO.INACTIVO)) {
    await prisma.usuario.update({ where: { id: usuarios[clave].id }, data: { estado } });
  }

  // Sprint 2: historial de asignaciones, comentarios, cambios de estado, confirmación y reapertura.
  if (conSolicitudes) await avanzarFlujoSemilla(prisma, usuarios, solicitudes);

  return { omitido: false, usuarios };
}
