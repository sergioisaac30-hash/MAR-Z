import { Field } from '../ui/componentes.jsx';
import { hoyLocal } from '../../utils/fecha.js';

const LIMITE_JUSTIFICACION = 1000;

// Cambio 1 (CAM-01) · Campos adicionales cuando la prioridad elegida es "Alta".
export function CamposPrioridadAlta({ justificacion, fecha, onJustificacion, onFecha, errores = {} }) {
  return (
    <>
      <Field
        className="span-2"
        label="Justificación de la prioridad Alta"
        required
        error={errores.justificacionPrioridad}
        counter={`${justificacion.length}/${LIMITE_JUSTIFICACION}`}
        hint="Explique por qué esta solicitud requiere atención urgente."
      >
        <textarea className="textarea" rows={3} value={justificacion} maxLength={LIMITE_JUSTIFICACION} onChange={(e) => onJustificacion(e.target.value)} />
      </Field>
      <Field label="Fecha objetivo" required error={errores.fechaObjetivo} hint="Hoy o una fecha posterior.">
        <input className="input" type="date" min={hoyLocal()} value={fecha} onChange={(e) => onFecha(e.target.value)} />
      </Field>
    </>
  );
}
