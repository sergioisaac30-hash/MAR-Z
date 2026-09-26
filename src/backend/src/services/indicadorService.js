import { ACCIONES, ESTADOS } from '../domain/constantes.js';
import { filtroSolicitudes } from './solicitudService.js';

const HORA_MS = 3600 * 1000;

// HU10 · Eventos registrados que se cuentan, en el orden en que se presentan.
export const TIPOS_EVENTO = [
  ACCIONES.PRIORIDAD_CAMBIADA,
  ACCIONES.ASIGNACION,
  ACCIONES.ESTADO_CAMBIADO,
  ACCIONES.COMENTARIO_REGISTRADO,
  ACCIONES.CONFIRMACION,
  ACCIONES.REAPERTURA,
];

export function mediana(valores) {
  if (valores.length === 0) return null;
  const orden = [...valores].sort((a, b) => a - b);
  const medio = Math.floor(orden.length / 2);
  return orden.length % 2 ? orden[medio] : (orden[medio - 1] + orden[medio]) / 2;
}

const redondear = (n) => (n === null ? null : Math.round(n * 10) / 10);

/**
 * HU10 · Indicadores AGREGADOS del servicio. Por diseño no se agrupa, ordena ni filtra por
 * persona: no hay rankings, puntuaciones individuales ni datos que comparen personas.
 */
export function crearServicioIndicadores({ prisma }) {
  return {
    async obtener(user, filtros) {
      const where = filtroSolicitudes(user, filtros);
      const [porEstado, estados, cerradas, eventos] = await Promise.all([
        prisma.solicitud.groupBy({ by: ['estadoId'], where, _count: { _all: true } }),
        prisma.estado.findMany({ orderBy: { orden: 'asc' } }),
        prisma.solicitud.findMany({
          where: { AND: [where, { estadoId: ESTADOS.CERRADA, cerradaEn: { not: null } }] },
          select: { creadaEn: true, cerradaEn: true },
        }),
        prisma.auditoria.findMany({
          where: { accionId: { in: TIPOS_EVENTO }, solicitud: { is: where } },
          select: { accionId: true, solicitudId: true, creadoEn: true },
        }),
      ]);

      const conteo = Object.fromEntries(porEstado.map((g) => [g.estadoId, g._count._all]));
      const volumenPorEstado = estados.map((e) => ({ estado: e.codigo, cantidad: conteo[e.codigo] ?? 0 }));

      const duraciones = cerradas.map((s) => (s.cerradaEn - s.creadaEn) / HORA_MS);

      // Un evento puede registrar varios campos a la vez (p. ej. reapertura: estado y motivo);
      // se cuenta una vez por acción, solicitud e instante.
      const unicos = new Set(eventos.map((e) => `${e.accionId}|${e.solicitudId}|${e.creadoEn.getTime()}`));
      const porTipo = {};
      for (const clave of unicos) {
        const accion = clave.split('|')[0];
        porTipo[accion] = (porTipo[accion] ?? 0) + 1;
      }

      return {
        filtros,
        generadoEn: new Date(),
        total: volumenPorEstado.reduce((suma, e) => suma + e.cantidad, 0),
        volumenPorEstado,
        tiempoMedianoCiclo: {
          horas: redondear(mediana(duraciones)),
          muestras: duraciones.length,
          definicion: 'Mediana del tiempo entre la creación y el cierre confirmado de las solicitudes en estado Cerrada.',
        },
        eventosPorTipo: TIPOS_EVENTO.map((accion) => ({ accion, cantidad: porTipo[accion] ?? 0 })),
      };
    },
  };
}
