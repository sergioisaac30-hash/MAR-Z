import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { solicitudesApi } from '../api/cliente.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { ROLES } from '../auth/roles.js';
import { useCarga } from '../hooks/useApi.js';
import { EliminarSolicitudModal } from '../components/solicitudes/EliminarSolicitudModal.jsx';
import { puedeEliminarSolicitud } from '../components/solicitudes/permisos.js';
import { PrioridadModal } from '../components/solicitudes/PrioridadModal.jsx';
import { Button, EmptyState, ErrorState, Loading, PriorityBadge, StatusBadge, useToast } from '../components/ui/componentes.jsx';
import { Icon } from '../components/ui/Icon.jsx';
import { formatFechaHora, formatRelativo, iniciales } from '../utils/format.js';

function DatosSolicitud({ s }) {
  return (
    <section className="panel">
      <div className="panel__header"><h2 className="panel__title">Datos de la solicitud</h2></div>
      <div className="panel__body">
        <dl className="dl dl--stacked">
          <div><dt>Estado</dt><dd><StatusBadge estado={s.estado} /></dd></div>
          <div><dt>Prioridad</dt><dd><PriorityBadge prioridad={s.prioridad} /></dd></div>
          <div><dt>Categoría</dt><dd>{s.categoria.nombre}</dd></div>
          <div><dt>Solicitante</dt><dd>{s.solicitante.nombre}</dd></div>
          <div><dt>Creada</dt><dd>{formatFechaHora(s.creadaEn)}</dd></div>
          <div><dt>Última actualización</dt><dd>{formatFechaHora(s.actualizadaEn)}</dd></div>
          {s.cerradaEn ? <div><dt>Cerrada</dt><dd>{formatFechaHora(s.cerradaEn)}</dd></div> : null}
        </dl>
      </div>
    </section>
  );
}

function PanelGestion({ usuario, s, onAbrir }) {
  const esCoordinador = usuario.rol === ROLES.COORDINADOR;
  const mostrarPrioridad = esCoordinador && !s.esFinal;
  const mostrarEliminar = puedeEliminarSolicitud(usuario, s);
  if (!mostrarPrioridad && !mostrarEliminar) return null;
  return (
    <section className="panel">
      <div className="panel__header"><h2 className="panel__title">Gestión</h2></div>
      <div className="panel__body stack" style={{ gap: 8 }}>
        {mostrarPrioridad ? <Button icon="flag" block onClick={() => onAbrir('prioridad')}>Cambiar prioridad</Button> : null}
        {mostrarEliminar ? (
          <Button variant="danger" icon="trash" block onClick={() => onAbrir('eliminar')}>Eliminar solicitud</Button>
        ) : null}
      </div>
    </section>
  );
}

// HU03 · Detalle de la solicitud (dentro del alcance del rol) y HU04 · cambio de prioridad.
export default function SolicitudDetallePage() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [modal, setModal] = useState(null);
  const { datos: s, error, cargando, recargar } = useCarga((signal) => solicitudesApi.obtener(id, { signal }), [id]);

  const cerrarModal = () => setModal(null);

  if (cargando && !s) return <Loading />;
  if (error?.status === 404 || error?.status === 400) {
    return (
      <div className="panel">
        <EmptyState icono="search" titulo="Solicitud no disponible" accion={<Link className="btn btn--secondary" to="/solicitudes">Volver al listado</Link>}>
          La solicitud no existe o no tiene acceso a ella.
        </EmptyState>
      </div>
    );
  }
  if (error) return <ErrorState error={error} onReintentar={recargar} />;

  return (
    <>
      <div style={{ marginBottom: 12 }}>
        <Link to="/solicitudes" className="row muted" style={{ display: 'inline-flex', fontSize: 'var(--fs-sm)' }}>
          <Icon name="arrowLeft" size={14} /> Volver al listado
        </Link>
      </div>

      <header className="panel detail-head">
        <div className="row" style={{ gap: 6 }}>
          <span className="title-code">{s.codigo}</span>
          <StatusBadge estado={s.estado} />
          <PriorityBadge prioridad={s.prioridad} />
          <span className="badge badge--neutral">{s.categoria.nombre}</span>
        </div>
        <h1>{s.titulo}</h1>
        <div className="detail-head__meta">
          <span className="row" style={{ gap: 6 }}>
            <span className="avatar avatar--sm avatar--round" style={{ background: '#fef3c7', color: '#92400e' }}>{iniciales(s.solicitante.nombre)}</span>
            {s.solicitante.nombre}
          </span>
          <span className="row" style={{ gap: 5 }}><Icon name="clock" size={14} /> Creada {formatFechaHora(s.creadaEn)}</span>
          <span>Actualizada {formatRelativo(s.actualizadaEn)}</span>
        </div>
      </header>

      <div className="detail">
        <div className="detail__main">
          <section className="panel">
            <div className="panel__header"><h2 className="panel__title">Descripción</h2></div>
            <div className="panel__body"><p className="description">{s.descripcion}</p></div>
          </section>
        </div>

        <aside className="detail__side">
          <PanelGestion usuario={usuario} s={s} onAbrir={setModal} />
          <DatosSolicitud s={s} />
        </aside>
      </div>

      {modal === 'prioridad' ? (
        <PrioridadModal
          solicitud={s}
          onClose={cerrarModal}
          onGuardado={(a) => {
            setModal(null);
            toast.exito(`Prioridad de ${a.codigo} actualizada a ${a.prioridad}.`);
            recargar();
          }}
        />
      ) : null}

      {modal === 'eliminar' ? (
        <EliminarSolicitudModal
          solicitud={s}
          onClose={cerrarModal}
          onEliminado={() => {
            setModal(null);
            toast.exito('Solicitud eliminada');
            navigate('/solicitudes', { replace: true });
          }}
        />
      ) : null}
    </>
  );
}
