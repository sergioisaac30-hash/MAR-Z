import { solicitudesApi } from '../../api/cliente.js';
import { useCarga } from '../../hooks/useApi.js';
import { ErrorState, Loading } from '../ui/componentes.jsx';
import { formatFechaHora } from '../../utils/format.js';

// Cambia el nombre de columna de un campo (p. ej. "fecha_objetivo") por un texto legible.
export function nombreCampo(campo) {
  return {
    estado: 'Estado',
    prioridad: 'Prioridad',
    justificacion_prioridad: 'Justificación',
    fecha_objetivo: 'Fecha objetivo',
    motivo: 'Motivo',
    comentario: 'Comentario',
    agente_asignado: 'Agente asignado',
    reporte_solicitudes: 'Reporte exportado',
  }[campo] ?? campo;
}

// HU07 · Historial completo de la solicitud: actor codificado, fecha, campo y valores.
export function HistorialPanel({ solicitudId }) {
  const { datos, error, cargando, recargar } = useCarga((signal) => solicitudesApi.historial(solicitudId, { signal }), [solicitudId]);

  return (
    <section className="panel">
      <div className="panel__header"><h2 className="panel__title">Historial</h2></div>
      {cargando && !datos ? <Loading /> : null}
      {error ? <ErrorState error={error} onReintentar={recargar} /> : null}
      {datos ? (
        <ol className="timeline">
          {datos.datos.map((e) => (
            <li key={e.id} className={`timeline__item timeline__item--${e.accion.toLowerCase()}`}>
              <div className="timeline__head">
                <strong>{e.descripcion}</strong>
                <span className="muted" style={{ fontSize: 'var(--fs-xs)' }}>{formatFechaHora(e.fecha)}</span>
              </div>
              <div className="timeline__change">
                {nombreCampo(e.campo)}: {e.valorAnterior ? <del>{e.valorAnterior}</del> : null} {e.valorNuevo ?? '—'}
              </div>
              <div className="timeline__actor">{e.actor.codigo} · {e.actor.rol}</div>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
