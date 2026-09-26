import { z } from 'zod';
import { PRIORIDADES, PRIORIDAD_CON_JUSTIFICACION, PRIORIDAD_POR_DEFECTO } from '../domain/constantes.js';
import { hoyLocal } from '../utils/fechas.js';

// Valida que el id de la URL sea un número positivo.
export const idParam = z.object({ id: z.coerce.number().int().positive('Identificador no válido.') });

// Crea un validador de texto obligatorio con un largo máximo.
export const textoObligatorio = (campo, max) =>
  z
    .string({ required_error: `${campo} es obligatorio.`, invalid_type_error: `${campo} debe ser texto.` })
    .trim()
    .min(1, `${campo} es obligatorio.`)
    .max(max, `${campo} admite como máximo ${max} caracteres.`);

const prioridad = z.enum(PRIORIDADES, {
  errorMap: () => ({ message: `La prioridad debe ser una de: ${PRIORIDADES.join(', ')}.` }),
});

const fecha = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use el formato AAAA-MM-DD.')
  .refine(
    (v) => !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime()) && new Date(`${v}T00:00:00Z`).toISOString().startsWith(v),
    'Fecha no válida.',
  );

// Cambio 1 (CAM-01): la prioridad Alta exige justificación y fecha objetivo (hoy o posterior).
// Para las demás prioridades ambos campos se descartan, aunque el cliente los envíe.
function conReglaAlta(schema) {
  return schema
    .extend({
      justificacionPrioridad: z.string().trim().max(1000, 'La justificación admite como máximo 1000 caracteres.').optional().nullable(),
      fechaObjetivo: fecha.optional().nullable().or(z.literal('')),
    })
    .superRefine((d, ctx) => {
      if (d.prioridad !== PRIORIDAD_CON_JUSTIFICACION) return;
      if (!d.justificacionPrioridad) {
        ctx.addIssue({ code: 'custom', path: ['justificacionPrioridad'], message: 'La prioridad Alta requiere una justificación.' });
      }
      if (!d.fechaObjetivo) {
        ctx.addIssue({ code: 'custom', path: ['fechaObjetivo'], message: 'La prioridad Alta requiere una fecha objetivo.' });
      } else if (d.fechaObjetivo < hoyLocal()) {
        ctx.addIssue({ code: 'custom', path: ['fechaObjetivo'], message: 'La fecha objetivo no puede ser anterior a hoy.' });
      }
    })
    .transform((d) => (d.prioridad === PRIORIDAD_CON_JUSTIFICACION ? d : { ...d, justificacionPrioridad: null, fechaObjetivo: null }));
}

// HU02 (+ CAM-01) · Título, descripción y categoría son obligatorios. Estado o dueño enviados se ignoran.
export const crearSolicitudSchema = conReglaAlta(
  z.object({
    titulo: textoObligatorio('El título', 150),
    descripcion: textoObligatorio('La descripción', 4000),
    categoriaId: z.coerce
      .number({ required_error: 'La categoría es obligatoria.', invalid_type_error: 'La categoría es obligatoria.' })
      .int('La categoría es obligatoria.')
      .positive('La categoría es obligatoria.'),
    prioridad: prioridad.default(PRIORIDAD_POR_DEFECTO),
  }),
);

const vacioAIndefinido = (schema) => z.preprocess((v) => (v === '' || v === null ? undefined : v), schema);

// HU04 · Ordenar por prioridad, estado o fecha · HU08 · búsqueda por texto dentro del alcance.
export const listarSolicitudesQuery = z.object({
  orden: z.enum(['prioridad', 'estado', 'fecha']).default('fecha'),
  dir: z.enum(['asc', 'desc']).default('desc'),
  q: vacioAIndefinido(z.string().trim().max(200, 'La búsqueda admite como máximo 200 caracteres.').optional()),
});

// HU04 (+ CAM-01) · La prioridad nueva debe ser válida; Alta exige justificación y fecha objetivo.
export const cambiarPrioridadSchema = conReglaAlta(z.object({ prioridad }));
