import { useState } from 'react';
import { solicitudesApi } from '../../api/cliente.js';
import { Alert, Button, Field, Modal } from '../ui/componentes.jsx';

// HU08 · El solicitante propietario confirma o reabre una solicitud "Resuelta".
export function AccionesSolicitante({ solicitud, onCambiado }) {
  const [modal, setModal] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  if (solicitud.estado !== 'Resuelta') return null;

  async function confirmar() {
    setError(null);
    setEnviando(true);
    try {
      onCambiado(await solicitudesApi.confirmar(solicitud.id));
    } catch (err) {
      setError(err);
      setEnviando(false);
    }
  }

  async function reabrir(e) {
    e.preventDefault();
    if (!motivo.trim()) {
      setError({ message: 'El motivo es obligatorio.' });
      return;
    }
    setError(null);
    setEnviando(true);
    try {
      onCambiado(await solicitudesApi.reabrir(solicitud.id, { motivo }));
      setModal(null);
    } catch (err) {
      setError(err);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="panel">
      <div className="panel__header"><h2 className="panel__title">Solución propuesta</h2></div>
      <div className="panel__body stack" style={{ gap: 8 }}>
        {error && !modal ? <Alert tipo="error">{error.message}</Alert> : null}
        <p className="muted">Revise la atención recibida y confirme o reabra la solicitud si el problema persiste.</p>
        <Button variant="primary" icon="check" block loading={enviando && !modal} onClick={confirmar}>
          Confirmar solución
        </Button>
        <Button icon="arrowLeft" block onClick={() => setModal('reabrir')}>
          Reabrir con motivo
        </Button>
      </div>

      {modal === 'reabrir' ? (
        <Modal
          titulo="Reabrir solicitud"
          onClose={() => setModal(null)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setModal(null)}>Cancelar</Button>
              <Button variant="primary" type="submit" form="form-reabrir" loading={enviando}>Reabrir</Button>
            </>
          }
        >
          <form id="form-reabrir" className="stack" onSubmit={reabrir}>
            {error ? <Alert tipo="error">{error.message}</Alert> : null}
            <Field label="Motivo" required hint="Explique por qué el problema no quedó resuelto.">
              <textarea className="textarea" rows={3} maxLength={1000} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
            </Field>
          </form>
        </Modal>
      ) : null}
    </section>
  );
}
