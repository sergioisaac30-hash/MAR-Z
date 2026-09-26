import { useState } from 'react';
import { solicitudesApi } from '../../api/cliente.js';
import { useCarga } from '../../hooks/useApi.js';
import { Alert, Button, ErrorState, Loading } from '../ui/componentes.jsx';
import { formatFechaHora, iniciales } from '../../utils/format.js';

const LIMITE = 2000;

// HU06 · Comentarios de trabajo: visibles según el alcance; solo el agente asignado escribe.
export function ComentariosPanel({ solicitudId, puedeComentar }) {
  const { datos, error, cargando, recargar } = useCarga((signal) => solicitudesApi.listarComentarios(solicitudId, { signal }), [solicitudId]);
  const [contenido, setContenido] = useState('');
  const [errorEnvio, setErrorEnvio] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    if (!contenido.trim()) {
      setErrorEnvio('El comentario es obligatorio.');
      return;
    }
    setErrorEnvio(null);
    setEnviando(true);
    try {
      await solicitudesApi.comentar(solicitudId, { contenido });
      setContenido('');
      recargar();
    } catch (err) {
      setErrorEnvio(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="panel">
      <div className="panel__header"><h2 className="panel__title">Comentarios de trabajo</h2></div>
      {cargando && !datos ? <Loading /> : null}
      {error ? <ErrorState error={error} onReintentar={recargar} /> : null}
      {datos && datos.datos.length === 0 ? (
        <p className="muted" style={{ padding: '14px 18px' }}>Todavía no hay comentarios.</p>
      ) : null}
      {datos && datos.datos.length > 0 ? (
        <ul className="comments">
          {datos.datos.map((c) => (
            <li key={c.id} className="comment">
              <span className="comment__avatar">{iniciales(c.autor.nombre)}</span>
              <div className="comment__body">
                <div className="comment__meta">
                  <strong>{c.autor.nombre}</strong>
                  <span className="muted">{c.autor.rol}</span>
                  <span className="muted">· {formatFechaHora(c.creadoEn)}</span>
                </div>
                <p>{c.contenido}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      {puedeComentar ? (
        <form className="panel__footer stack" onSubmit={enviar}>
          {errorEnvio ? <Alert tipo="error">{errorEnvio}</Alert> : null}
          <textarea
            className="textarea"
            rows={3}
            placeholder="Registre lo que se hizo para atender la solicitud…"
            maxLength={LIMITE}
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
          />
          <Button type="submit" variant="primary" loading={enviando} style={{ alignSelf: 'flex-end' }}>
            Agregar comentario
          </Button>
        </form>
      ) : null}
    </section>
  );
}
