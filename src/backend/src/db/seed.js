import bcrypt from 'bcryptjs';
import { ACCIONES, ESTADOS, ESTADO_USUARIO } from '../domain/constantes.js';
import { registrarAuditoria } from '../services/solicitudService.js';

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

// Solicitudes semilla: dueño, categoría (posición en el catálogo), prioridad y antigüedad.
const SOLICITUDES_DEMO = [
  { sol: 'solNorte', cat: 1, prioridad: 'Media', dias: 1.2, titulo: 'Lector de códigos no responde en muelle 3', descripcion: 'El lector inalámbrico del muelle 3 no registra lecturas desde el cambio de turno. Se reinició sin éxito.' },
  { sol: 'solNorte', cat: 2, prioridad: 'Alta', dias: 0.4, titulo: 'Sin conexión en oficina de despacho', descripcion: 'Los equipos de la oficina de despacho no tienen acceso a la red interna. Afecta la emisión de guías.' },
  { sol: 'solNorte', cat: 5, prioridad: 'Baja', dias: 3.5, titulo: 'Impresora de etiquetas imprime desalineado', descripcion: 'Las etiquetas de la impresora de la línea 2 salen corridas hacia la derecha aproximadamente 3 mm.' },
  { sol: 'solNorte', cat: 6, prioridad: 'Baja', dias: 10, titulo: 'Aire acondicionado del cuarto de servidores ruidoso', descripcion: 'El equipo de aire acondicionado del cuarto de servidores produce un ruido fuerte desde el lunes.' },
  { sol: 'solSur', cat: 3, prioridad: 'Media', dias: 2.1, titulo: 'Error al cerrar inventario diario', descripcion: 'La aplicación de inventario muestra un error al confirmar el cierre diario del almacén sur.' },
  { sol: 'solSur', cat: 4, prioridad: 'Media', dias: 0.8, titulo: 'Alta de acceso para nuevo turno', descripcion: 'Se requiere habilitar acceso a la aplicación de recepción para el personal del turno nocturno.' },
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
      estadoId: ESTADOS.NUEVO,
      solicitanteId: usuarios[def.sol].id,
      creadaEn,
      actualizadaEn: creadaEn,
    },
  });
  const base = { solicitudId: solicitud.id, actorId: usuarios[def.sol].id, accion: ACCIONES.SOLICITUD_CREADA, fecha: creadaEn };
  await registrarAuditoria(tx, { ...base, campo: 'estado', nuevo: ESTADOS.NUEVO });
  await registrarAuditoria(tx, { ...base, campo: 'prioridad', nuevo: def.prioridad });
  return solicitud;
}

// Inserta usuarios y solicitudes de demostración; no hace nada si ya hay usuarios.
export async function seedDemo(prisma, { rounds = 12 } = {}) {
  if ((await prisma.usuario.count()) > 0) return { omitido: true };

  const passwordHash = await bcrypt.hash(PASSWORD_DEMO, rounds);
  const usuarios = {};
  // Todos se crean activos; al final se marca inactivo el que corresponde.
  for (const { clave, estado: _estado, ...datos } of USUARIOS_DEMO) {
    usuarios[clave] = await prisma.usuario.create({ data: { ...datos, passwordHash } });
  }
  const categorias = await prisma.categoria.findMany({ orderBy: { id: 'asc' } });

  for (const def of SOLICITUDES_DEMO) {
    await prisma.$transaction((tx) => crearSolicitud(tx, usuarios, categorias, def));
  }

  for (const { clave, estado } of USUARIOS_DEMO.filter((d) => d.estado === ESTADO_USUARIO.INACTIVO)) {
    await prisma.usuario.update({ where: { id: usuarios[clave].id }, data: { estado } });
  }
  return { omitido: false, usuarios };
}
