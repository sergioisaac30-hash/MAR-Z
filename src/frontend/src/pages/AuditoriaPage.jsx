import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { auditoriaApi } from '../api/cliente.js';
import { useCarga } from '../hooks/useApi.js';
import { nombreCampo } from '../components/solicitudes/HistorialPanel.jsx';
import { Button, EmptyState, ErrorState, Loading, PageHeader } from '../components/ui/componentes.jsx';
import { Icon } from '../components/ui/Icon.jsx';
import { formatFechaHora } from '../utils/format.js';

const CLAVES = ['accion', 'solicitud', 'desde', 'hasta', 'pagina'];

function Valor({ children }) {
  if (children === null || children === undefined) return <span className="muted">—</span>;
  return <span title={children}>{children}</span>;
}

// HU11 + CAM-02 · Historial de auditoría en solo lectura para el auditor.
export default function AuditoriaPage() {
  const [params, setParams] = useSearchParams();
  const filtros = Object.fromEntries(CLAVES.filter((k) => params.get(k)).map((k) => [k, params.get(k)]));
  const clave = params.toString();
  const { datos, error, cargando, recargar } = useCarga((signal) => auditoriaApi.listar(filtros, { signal }), [clave]);
  const [codigo, setCodigo] = useState(filtros.solicitud ?? '');
  useEffect(() => setCodigo(params.get('solicitud') ?? ''), [params]);

  const actualizar = (cambios) => {
    const siguiente = new URLSearchParams(params);
    for (const [k, v] of Object.entries({ ...cambios, pagina: cambios.pagina ?? '' })) (v ? siguiente.set(k, v) : siguiente.delete(k));
    setParams(siguiente, { replace: true });
  };
  const pagina = Number(filtros.pagina ?? 1);

  return (
    <>
      <PageHeader
        eyebrow="Auditoría"
        titulo="Historial de cambios"
        descripcion="Registro de las decisiones sobre las solicitudes. Los actores aparecen con su código, nunca con su nombre."
        acciones={<span className="badge badge--neutral"><Icon name="lock" size={12} /> Solo lectura</span>}
      />
      <section className="panel">
        <div className="toolbar">
          <select className="select filtro" aria-label="Filtrar por acción" value={filtros.accion ?? ''} onChange={(e) => actualizar({ accion: e.target.value })}>
            <option value="">Acción: todas</option>
            {datos?.acciones.map((a) => <option key={a.codigo} value={a.codigo}>{a.descripcion}</option>)}
          </select>
          <div className="search" style={{ maxWidth: 180 }}>
            <Icon name="search" />
            <input
              className="input"
              aria-label="Filtrar por código de solicitud"
              placeholder="SOL-00012"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              onBlur={() => actualizar({ solicitud: codigo.trim() })}
            />
          </div>
          <label className="row muted" style={{ fontSize: 'var(--fs-sm)', gap: 6 }}>
            Desde <input className="input" style={{ width: 'auto' }} type="date" value={filtros.desde ?? ''} onChange={(e) => actualizar({ desde: e.target.value })} />
          </label>
          <label className="row muted" style={{ fontSize: 'var(--fs-sm)', gap: 6 }}>
            Hasta <input className="input" style={{ width: 'auto' }} type="date" value={filtros.hasta ?? ''} onChange={(e) => actualizar({ hasta: e.target.value })} />
          </label>
          {Object.keys(filtros).length ? (
            <Button variant="ghost" size="sm" icon="x" onClick={() => setParams({}, { replace: true })}>Limpiar</Button>
          ) : null}
        </div>

        {cargando && !datos ? <Loading /> : null}
        {error ? <ErrorState error={error} onReintentar={recargar} /> : null}
        {datos && datos.datos.length === 0 ? <EmptyState icono="shield" titulo="Sin eventos">No hay eventos que cumplan los filtros.</EmptyState> : null}
        {datos && datos.datos.length > 0 ? (
          <div className="table-wrap">
            <table className="table table--responsive">
              <thead>
                <tr>
                  <th scope="col">Fecha</th>
                  <th scope="col">Actor</th>
                  <th scope="col">Acción</th>
                  <th scope="col">Solicitud</th>
                  <th scope="col">Campo</th>
                  <th scope="col">Valor anterior</th>
                  <th scope="col">Valor nuevo</th>
                </tr>
              </thead>
              <tbody>
                {datos.datos.map((e) => (
                  <tr key={e.id}>
                    <td data-label="Fecha" className="nowrap">{formatFechaHora(e.fecha)}</td>
                    <td data-label="Actor" className="nowrap"><span className="mono">{e.actor}</span> · {e.rolActor}</td>
                    <td data-label="Acción">{e.descripcion}</td>
                    <td data-label="Solicitud" className="nowrap">{e.solicitud ? <span className="mono">{e.solicitud}</span> : <span className="muted">—</span>}</td>
                    <td data-label="Campo">{nombreCampo(e.campo)}</td>
                    <td data-label="Anterior"><Valor>{e.valorAnterior}</Valor></td>
                    <td data-label="Nuevo"><Valor>{e.valorNuevo}</Valor></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        {datos && datos.paginas > 1 ? (
          <div className="row" style={{ justifyContent: 'space-between', padding: '12px 16px' }}>
            <span className="muted" style={{ fontSize: 'var(--fs-sm)' }}>Página {datos.pagina} de {datos.paginas}</span>
            <div className="row">
              <Button size="sm" icon="arrowLeft" disabled={pagina <= 1} onClick={() => actualizar({ pagina: String(pagina - 1) })} aria-label="Página anterior" />
              <Button size="sm" disabled={pagina >= datos.paginas} onClick={() => actualizar({ pagina: String(pagina + 1) })}>Siguiente</Button>
            </div>
          </div>
        ) : null}
      </section>
    </>
  );
}
