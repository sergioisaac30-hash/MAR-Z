import { z } from 'zod';
import { ESTADOS } from '../domain/constantes.js';
import { textoObligatorio } from './solicitudValidators.js';

// HU05 · Asignar solicitud a un agente.
export const asignarSchema = z.object({
  agenteId: z.coerce
    .number({ required_error: 'Seleccione un agente.', invalid_type_error: 'Seleccione un agente.' })
    .int()
    .positive('Seleccione un agente.'),
});

// HU06 · El comentario no puede estar vacío.
export const comentarioSchema = z.object({ contenido: textoObligatorio('El comentario', 2000) });

// HU07 · El estado destino debe ser uno de los que existen.
export const cambiarEstadoSchema = z.object({
  estado: z.enum(Object.values(ESTADOS), { errorMap: () => ({ message: 'Estado no válido.' }) }),
});

// HU08 · Reabrir exige un motivo.
export const reaperturaSchema = z.object({ motivo: textoObligatorio('El motivo', 1000) });
