import { useState } from 'react';
import { Link } from 'react-router-dom';
import { solicitudesApi } from '../api/cliente.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { ROLES } from '../auth/roles.js';
import { useCarga } from '../hooks/useApi.js';
import { AsignarModal } from '../components/solicitudes/AsignarModal.jsx';
import { BuscadorTexto } from '../components/solicitudes/BuscadorTexto.jsx';
import { EliminarSolicitudModal } from '../components/solicitudes/EliminarSolicitudModal.jsx';
import { puedeAsignar, puedeEliminarSolicitud } from '../components/solicitudes/permisos.js';
import { PrioridadModal } from '../components/solicitudes/PrioridadModal.jsx';
import { SolicitudesTable } from '../components/solicitudes/SolicitudesTable.jsx';
import { Button, EmptyState, ErrorState, Loading, PageHeader, useToast } from '../components/ui/componentes.jsx';
import { Icon } from '../components/ui/Icon.jsx';

const ORDENES = [
  ['prioridad', 'Prioridad'],
  ['estado', 'Estado'],
  ['fecha', 'Fecha de creación'],
];

// Cabecera de bienvenida: saludo personalizado y un dato de un vistazo según el rol.
function WelcomeBand({ nombre, resumen }) {
  return (
    <div className="welcome-band">
      <div className="welcome-band__text">
        <h2 className="welcome-band__saludo">Hola, {nombre}</h2>
        <p className="welcome-band__resumen">{resumen}</p>
      </div>
    </div>
  );
}

// HU03 (+ HU08) · Vista del solicitante: solo sus propias solicitudes, con búsqueda por texto.
function VistaSolicitante() {
  const { usuario } = useAuth();
  const toast = useToast();
  const [orden, setOrden] = useState({ orden: 'fecha', dir: 'desc' });
  const [q, setQ] = useState('');
  const clave = JSON.stringify({ ...orden, q });
  const [aEliminar, setAEliminar] = useState(null);
  const { datos, error, cargando, recargar } = useCarga((signal) => solicitudesApi.listar({ ...orden, q }, { signal }), [clave]);
  const abiertas = datos ? datos.datos.filter((s) => !s.esFinal).length : null;

  return (
    <>
      <WelcomeBand
        nombre={usuario.nombre.split(' ')[0]}
        resumen={abiertas === null ? 'Consultando sus solicitudes…' : `Tiene ${abiertas} ${abiertas === 1 ? 'solicitud abierta' : 'solicitudes abiertas'}.`}
      />
      <PageHeader
        eyebrow="Solicitudes"
        titulo="Mis solicitudes"
        descripcion="Solo se muestran las solicitudes que usted registró. Abra una para ver su detalle y estado."
        acciones={
          <Link to="/solicitudes/nueva" className="btn btn--primary">
            <Icon name="plus" /> Nueva solicitud
          </Link>
        }
      />
      <section className="panel">
        <div className="toolbar">
          <BuscadorTexto value={q} onChange={setQ} />
        </div>
        {cargando && !datos ? <Loading /> : null}
        {error ? <ErrorState error={error} onReintentar={recargar} /> : null}
        {datos && datos.datos.length === 0 ? (
          <EmptyState titulo={q ? 'Ninguna solicitud coincide con la búsqueda' : 'Aún no hay solicitudes'} accion={<Link to="/solicitudes/nueva" className="btn btn--secondary">Crear la primera</Link>}>
            {q ? 'Pruebe con otro título o descripción.' : 'Cuando registre una solicitud aparecerá aquí con su estado actualizado.'}
          </EmptyState>
        ) : null}
        {datos && datos.datos.length > 0 ? (
          <SolicitudesTable
            solicitudes={datos.datos}
            orden={orden.orden}
            dir={orden.dir}
            onOrden={(o, d) => setOrden({ orden: o, dir: d })}
            acciones={(s) =>
              puedeEliminarSolicitud(usuario, s) ? (
                <Button size="sm" icon="trash" onClick={() => setAEliminar(s)} aria-label={`Eliminar ${s.codigo}`} title="Eliminar solicitud" />
              ) : null
            }
          />
        ) : null}
      </section>

      {aEliminar ? (
        <EliminarSolicitudModal
          solicitud={aEliminar}
          onClose={() => setAEliminar(null)}
          onEliminado={() => {
            setAEliminar(null);
            toast.exito('Solicitud eliminada');
            recargar();
          }}
        />
      ) : null}
    </>
  );
}

// HU04 (+ HU05) · Vista del coordinador: todas las solicitudes, ordenables, con priorizar y asignar.
function VistaCoordinador() {
  const { usuario } = useAuth();
  const toast = useToast();
  const [orden, setOrden] = useState({ orden: 'prioridad', dir: 'desc' });
  const clave = JSON.stringify(orden);
  const [seleccion, setSeleccion] = useState(null);
  const [aAsignar, setAAsignar] = useState(null);
  const [aEliminar, setAEliminar] = useState(null);
  const { datos, error, cargando, recargar } = useCarga((signal) => solicitudesApi.listar(orden, { signal }), [clave]);

  const ordenar = (o, d) => setOrden({ orden: o, dir: d });
  const total = datos ? datos.datos.length : null;
  const altas = datos ? datos.datos.filter((s) => s.prioridad === 'Alta').length : null;

  return (
    <>
      <WelcomeBand
        nombre={usuario.nombre.split(' ')[0]}
        resumen={total === null ? 'Consultando la cola de atención…' : `${total} solicitudes en total, ${altas} en prioridad Alta.`}
      />
      <PageHeader
        eyebrow="Gestión"
        titulo="Priorización"
        descripcion="Ordene la cola de atención, asigne un agente y cambie la prioridad. Cada cambio queda registrado con su autor y fecha."
        acciones={
          <div className="row">
            <label htmlFor="orden" className="muted" style={{ fontSize: 'var(--fs-sm)' }}>Ordenar por</label>
            <select id="orden" className="select" style={{ width: 'auto' }} value={orden.orden} onChange={(e) => ordenar(e.target.value, orden.dir)}>
              {ORDENES.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            </select>
            <Button
              icon={orden.dir === 'desc' ? 'arrowDown' : 'arrowUp'}
              onClick={() => ordenar(orden.orden, orden.dir === 'desc' ? 'asc' : 'desc')}
              aria-label={orden.dir === 'desc' ? 'Orden descendente' : 'Orden ascendente'}
              title={orden.dir === 'desc' ? 'Descendente' : 'Ascendente'}
            />
          </div>
        }
      />
      <section className="panel">
        {cargando && !datos ? <Loading /> : null}
        {error ? <ErrorState error={error} onReintentar={recargar} /> : null}
        {datos?.datos.length === 0 ? <EmptyState titulo="No hay solicitudes registradas" /> : null}
        {datos?.datos.length ? (
          <SolicitudesTable
            solicitudes={datos.datos}
            orden={orden.orden}
            dir={orden.dir}
            onOrden={ordenar}
            mostrarSolicitante
            acciones={(s) => (
              <span className="row" style={{ gap: 4, justifyContent: 'flex-end' }}>
                {puedeAsignar(usuario, s) ? (
                  <Button size="sm" icon="user" onClick={() => setAAsignar(s)} aria-label={`Asignar ${s.codigo}`} title="Asignar agente" />
                ) : null}
                {!s.esFinal ? (
                  <Button size="sm" icon="flag" onClick={() => setSeleccion(s)} aria-label={`Priorizar ${s.codigo}`} title="Cambiar prioridad" />
                ) : null}
                {puedeEliminarSolicitud(usuario, s) ? (
                  <Button size="sm" icon="trash" onClick={() => setAEliminar(s)} aria-label={`Eliminar ${s.codigo}`} title="Eliminar solicitud" />
                ) : null}
              </span>
            )}
          />
        ) : null}
      </section>

      {seleccion ? (
        <PrioridadModal
          solicitud={seleccion}
          onClose={() => setSeleccion(null)}
          onGuardado={(act) => {
            setSeleccion(null);
            toast.exito(`Prioridad de ${act.codigo} actualizada a ${act.prioridad}.`);
            recargar();
          }}
        />
      ) : null}

      {aAsignar ? (
        <AsignarModal
          solicitud={aAsignar}
          onClose={() => setAAsignar(null)}
          onAsignado={(act) => {
            setAAsignar(null);
            toast.exito(`${act.codigo} asignada a ${act.asignacion.agente.nombre}.`);
            recargar();
          }}
        />
      ) : null}

      {aEliminar ? (
        <EliminarSolicitudModal
          solicitud={aEliminar}
          onClose={() => setAEliminar(null)}
          onEliminado={() => {
            setAEliminar(null);
            toast.exito('Solicitud eliminada');
            recargar();
          }}
        />
      ) : null}
    </>
  );
}

// HU05/HU06/HU07 · Vista del agente: solo las solicitudes que tiene asignadas.
function VistaAgente() {
  const { usuario } = useAuth();
  const [orden, setOrden] = useState({ orden: 'fecha', dir: 'desc' });
  const clave = JSON.stringify(orden);
  const { datos, error, cargando, recargar } = useCarga((signal) => solicitudesApi.listar(orden, { signal }), [clave]);
  const enAtencion = datos ? datos.datos.filter((s) => !s.esFinal).length : null;

  return (
    <>
      <WelcomeBand
        nombre={usuario.nombre.split(' ')[0]}
        resumen={enAtencion === null ? 'Consultando sus solicitudes asignadas…' : `Tiene ${enAtencion} ${enAtencion === 1 ? 'solicitud asignada' : 'solicitudes asignadas'} en curso.`}
      />
      <PageHeader eyebrow="Solicitudes" titulo="Asignadas a mí" descripcion="Solo se muestran las solicitudes que tiene asignadas actualmente." />
      <section className="panel">
        {cargando && !datos ? <Loading /> : null}
        {error ? <ErrorState error={error} onReintentar={recargar} /> : null}
        {datos && datos.datos.length === 0 ? (
          <EmptyState icono="inbox" titulo="No tiene solicitudes asignadas">
            El coordinador le asignará solicitudes a medida que las reciba.
          </EmptyState>
        ) : null}
        {datos && datos.datos.length > 0 ? (
          <SolicitudesTable solicitudes={datos.datos} orden={orden.orden} dir={orden.dir} onOrden={(o, d) => setOrden({ orden: o, dir: d })} />
        ) : null}
      </section>
    </>
  );
}

// El auditor: sus funciones no están en este sprint.
function VistaProximosSprints() {
  const { usuario } = useAuth();
  return (
    <>
      <WelcomeBand nombre={usuario.nombre.split(' ')[0]} resumen="Sus funciones llegan en próximos sprints." />
      <PageHeader eyebrow="Solicitudes" titulo="Solicitudes" />
      <section className="panel">
        <EmptyState icono="clock" titulo="Sus funciones llegan en próximos sprints">
          Este rol se incorporará al sistema en una próxima entrega.
        </EmptyState>
      </section>
    </>
  );
}

/**
 * HU03/HU04/HU05 · Una sola página que muestra la vista según el rol: el solicitante ve
 * sus propias solicitudes, el coordinador ve todas y el agente solo las asignadas.
 */
export default function SolicitudesPage() {
  const { usuario } = useAuth();
  if (usuario.rol === ROLES.COORDINADOR) return <VistaCoordinador />;
  if (usuario.rol === ROLES.SOLICITANTE) return <VistaSolicitante />;
  if (usuario.rol === ROLES.AGENTE) return <VistaAgente />;
  return <VistaProximosSprints />;
}
