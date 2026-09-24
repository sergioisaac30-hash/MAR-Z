import { useNavigate } from 'react-router-dom';
import { PriorityBadge, StatusBadge } from '../ui/componentes.jsx';
import { Icon } from '../ui/Icon.jsx';
import { formatFecha, formatFechaHora, formatRelativo } from '../../utils/format.js';

function Encabezado({ campo, children, orden, dir, onOrden }) {
  if (!onOrden) return <th scope="col">{children}</th>;
  const activo = orden === campo;
  const siguiente = activo && dir === 'desc' ? 'asc' : 'desc';
  return (
    <th scope="col">
      <button
        type="button"
        className="th-sort"
        aria-sort={activo ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
        onClick={() => onOrden(campo, siguiente)}
        title={`Ordenar por ${children.toLowerCase()}`}
      >
        {children}
        <Icon name={activo ? (dir === 'asc' ? 'arrowUp' : 'arrowDown') : 'sort'} size={12} />
      </button>
    </th>
  );
}

/**
 * Tabla de solicitudes reutilizada por solicitante y coordinador.
 * Ordenable por prioridad, estado y fecha (HU04).
 */
export function SolicitudesTable({ solicitudes, orden, dir, onOrden, mostrarSolicitante = false, acciones }) {
  const navigate = useNavigate();
  const sortProps = { orden, dir, onOrden };

  return (
    <div className="table-wrap">
      <table className="table table--responsive">
        <thead>
          <tr>
            <th scope="col">Código</th>
            <th scope="col">Solicitud</th>
            <Encabezado campo="prioridad" {...sortProps}>Prioridad</Encabezado>
            <Encabezado campo="estado" {...sortProps}>Estado</Encabezado>
            <Encabezado campo="fecha" {...sortProps}>Creada</Encabezado>
            <th scope="col">Última actualización</th>
            {acciones ? <th scope="col"><span className="visually-hidden">Acciones</span></th> : null}
          </tr>
        </thead>
        <tbody>
          {solicitudes.map((s) => (
            <tr key={s.id} className="is-clickable" onClick={() => navigate(`/solicitudes/${s.id}`)}>
              <td data-label="Código" className="nowrap"><span className="mono">{s.codigo}</span></td>
              <td data-label="Solicitud" className="col-grow" title={s.titulo}>
                <div>
                  <div className="table__title">{s.titulo}</div>
                  <div className="table__sub">
                    {s.categoria.nombre}
                    {mostrarSolicitante ? ` · ${s.solicitante.nombre}` : ''}
                  </div>
                </div>
              </td>
              <td data-label="Prioridad"><PriorityBadge prioridad={s.prioridad} /></td>
              <td data-label="Estado" className="nowrap"><StatusBadge estado={s.estado} /></td>
              <td data-label="Creada" className="nowrap" title={formatFechaHora(s.creadaEn)}>{formatFecha(s.creadaEn)}</td>
              <td data-label="Actualización" className="nowrap" title={formatFechaHora(s.actualizadaEn)}>{formatRelativo(s.actualizadaEn)}</td>
              {acciones ? (
                <td data-label="" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'right' }}>
                  {acciones(s)}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
