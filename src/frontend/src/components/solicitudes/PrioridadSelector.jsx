import { PriorityBadge } from '../ui/componentes.jsx';

const PRIORIDADES = ['Baja', 'Media', 'Alta'];

// Selector segmentado de prioridad (radiogroup accesible).
export function PrioridadSelector({ value, onChange, id, ...aria }) {
  return (
    <div className="segmented" role="radiogroup" id={id} {...aria}>
      {PRIORIDADES.map((p) => (
        <button key={p} type="button" role="radio" aria-checked={value === p} onClick={() => onChange(p)}>
          <PriorityBadge prioridad={p} />
        </button>
      ))}
    </div>
  );
}
