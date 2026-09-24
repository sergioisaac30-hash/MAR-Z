import { z } from 'zod';
import { PRIORIDADES, PRIORIDAD_POR_DEFECTO } from '../domain/constantes.js';

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

// HU02 · Título, descripción y categoría son obligatorios. Estado o dueño enviados se ignoran.
export const crearSolicitudSchema = z.object({
  titulo: textoObligatorio('El título', 150),
  descripcion: textoObligatorio('La descripción', 4000),
  categoriaId: z.coerce
    .number({ required_error: 'La categoría es obligatoria.', invalid_type_error: 'La categoría es obligatoria.' })
    .int('La categoría es obligatoria.')
    .positive('La categoría es obligatoria.'),
  prioridad: prioridad.default(PRIORIDAD_POR_DEFECTO),
});

// HU04 · Ordenar por prioridad, estado o fecha.
export const listarSolicitudesQuery = z.object({
  orden: z.enum(['prioridad', 'estado', 'fecha']).default('fecha'),
  dir: z.enum(['asc', 'desc']).default('desc'),
});

// HU04 · La prioridad nueva debe ser válida.
export const cambiarPrioridadSchema = z.object({ prioridad });
