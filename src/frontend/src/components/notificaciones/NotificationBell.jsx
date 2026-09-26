import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificacionesApi } from '../../api/cliente.js';
import { Icon } from '../ui/Icon.jsx';
import { formatRelativo } from '../../utils/format.js';

// HU05 · Campana de notificaciones: contador de no leídas, lista y marcar como leída.
export function NotificationBell() {
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const [datos, setDatos] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const ref = useRef(null);

  async function cargar() {
    const res = await notificacionesApi.listar();
    setDatos(res.datos);
    setNoLeidas(res.noLeidas);
  }

  useEffect(() => {
    cargar().catch(() => {});
  }, []);

  useEffect(() => {
    if (!abierto) return;
    const onClick = (e) => !ref.current?.contains(e.target) && setAbierto(false);
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [abierto]);

  async function abrirNotificacion(n) {
    if (!n.leidaEn) {
      await notificacionesApi.marcarLeida(n.id);
      await cargar();
    }
    setAbierto(false);
    if (n.solicitudId) navigate(`/solicitudes/${n.solicitudId}`);
  }

  return (
    <div className="notif" ref={ref}>
      <button
        type="button"
        className="btn btn--ghost btn--icon"
        onClick={() => setAbierto((v) => !v)}
        aria-label={`Notificaciones${noLeidas ? `, ${noLeidas} sin leer` : ''}`}
        aria-expanded={abierto}
      >
        <Icon name="bell" size={18} />
        {noLeidas > 0 ? <span className="notif__count">{noLeidas > 9 ? '9+' : noLeidas}</span> : null}
      </button>
      {abierto ? (
        <div className="notif__panel" role="dialog" aria-label="Notificaciones">
          <div className="notif__head">
            <strong style={{ fontSize: 'var(--fs-sm)' }}>Notificaciones</strong>
            {noLeidas > 0 ? (
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={async () => {
                  await notificacionesApi.marcarTodas();
                  await cargar();
                }}
              >
                Marcar todas leídas
              </button>
            ) : null}
          </div>
          {datos.length === 0 ? (
            <p className="muted" style={{ padding: '14px 16px', fontSize: 'var(--fs-sm)' }}>
              No tiene notificaciones.
            </p>
          ) : (
            <ul className="notif__list">
              {datos.map((n) => (
                <li key={n.id}>
                  <button type="button" className={`notif__item ${n.leidaEn ? '' : 'is-unread'}`} onClick={() => abrirNotificacion(n)}>
                    <span>{n.mensaje}</span>
                    <span className="notif__time">{formatRelativo(n.creadaEn)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
