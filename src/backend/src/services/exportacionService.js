import { ACCIONES, formatCodigo } from '../domain/constantes.js';
import { generarCsv } from '../utils/csv.js';
import { dateAFecha } from '../utils/fechas.js';
import { filtroSolicitudes, registrarAuditoria } from './solicitudService.js';

/**
 * HU12 + CAM-02 · Columnas del reporte. Solo datos estructurados: se excluyen credenciales,
 * datos personales y TODO texto libre (título, descripción, justificación, motivos y comentarios).
 * Tampoco se incluye el agente asignado, para no habilitar comparaciones entre personas.
 */
export const COLUMNAS_REPORTE = [
  'codigo',
  'categoria',
  'prioridad',
  'estado',
  'asignada',
  'fecha_creacion',
  'ultima_actualizacion',
  'fecha_objetivo',
  'fecha_cierre',
  'horas_ciclo',
];

const iso = (d) => (d ? d.toISOString() : '');
const horasCiclo = (s) => (s.cerradaEn ? ((s.cerradaEn - s.creadaEn) / 3600000).toFixed(1) : '');

function fila(s) {
  return [
    formatCodigo(s.id),
    s.categoria.nombre,
    s.prioridadId,
    s.estadoId,
    s.asignaciones.length ? 'Sí' : 'No',
    iso(s.creadaEn),
    iso(s.actualizadaEn),
    dateAFecha(s.fechaObjetivo) ?? '',
    iso(s.cerradaEn),
    horasCiclo(s),
  ];
}

function marcaDeTiempo(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

export function crearServicioExportacion({ prisma }) {
  return {
    // Genera el CSV con los filtros aplicados y registra la exportación (tabla + auditoría) en una sola transacción.
    async exportarSolicitudes(user, filtros) {
      return prisma.$transaction(async (tx) => {
        const solicitudes = await tx.solicitud.findMany({
          where: filtroSolicitudes(user, filtros),
          select: {
            id: true,
            prioridadId: true,
            estadoId: true,
            creadaEn: true,
            actualizadaEn: true,
            cerradaEn: true,
            fechaObjetivo: true,
            categoria: { select: { nombre: true } },
            asignaciones: { where: { vigente: true }, select: { id: true } },
          },
          orderBy: { id: 'asc' },
        });
        const ahora = new Date();
        const filtrosJson = JSON.stringify(filtros);
        const registro = await tx.exportacion.create({
          data: { usuarioId: user.id, filtros: filtrosJson, filas: solicitudes.length, creadaEn: ahora },
        });
        await registrarAuditoria(tx, {
          actorId: user.id,
          accion: ACCIONES.EXPORTACION,
          campo: 'reporte_solicitudes',
          nuevo: `Exportación #${registro.id}: ${solicitudes.length} fila(s); filtros ${filtrosJson}`,
          fecha: ahora,
        });
        return {
          csv: generarCsv(COLUMNAS_REPORTE, solicitudes.map(fila)),
          filas: solicitudes.length,
          nombreArchivo: `solicitudes-${marcaDeTiempo(ahora)}.csv`,
        };
      });
    },
  };
}
