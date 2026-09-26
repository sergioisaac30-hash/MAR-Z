import { z } from 'zod';
import { parseCodigo } from '../domain/constantes.js';

const vacioAIndefinido = (schema) => z.preprocess((v) => (v === '' || v === null ? undefined : v), schema);
const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use el formato AAAA-MM-DD.');

// HU11 · Filtros del historial: acción, solicitud (código SOL-00000 o número), rango de fechas y página.
export const auditoriaQuery = z
  .object({
    accion: vacioAIndefinido(z.string().regex(/^[A-Z_]{3,40}$/, 'Acción no válida.').optional()),
    solicitud: vacioAIndefinido(
      z
        .string()
        .transform((v, ctx) => {
          const id = /^\d+$/.test(v.trim()) ? Number(v.trim()) : parseCodigo(v);
          if (!id) ctx.addIssue({ code: 'custom', message: 'Use un código como SOL-00012.' });
          return id;
        })
        .optional(),
    ),
    desde: vacioAIndefinido(fecha.optional()),
    hasta: vacioAIndefinido(fecha.optional()),
    pagina: vacioAIndefinido(z.coerce.number().int().min(1).default(1)),
    tamano: vacioAIndefinido(z.coerce.number().int().min(5).max(100).default(25)),
  })
  .refine((q) => !q.desde || !q.hasta || q.desde <= q.hasta, { message: '"Desde" no puede ser posterior a "hasta".', path: ['desde'] })
  .transform(({ solicitud, ...resto }) => ({ ...resto, solicitudId: solicitud }));
