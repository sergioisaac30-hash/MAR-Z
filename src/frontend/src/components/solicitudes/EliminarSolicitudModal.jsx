import { useState } from 'react';
import { solicitudesApi } from '../../api/cliente.js';
import { Alert, Button, Modal } from '../ui/componentes.jsx';

// Eliminar solicitud (borrado lógico): siempre se confirma antes de aplicar el cambio.
export function EliminarSolicitudModal({ solicitud, onClose, onEliminado }) {
  const [error, setError] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  async function confirmar() {
    setError(null);
    setEliminando(true);
    try {
      await solicitudesApi.eliminar(solicitud.id);
      onEliminado(solicitud);
    } catch (err) {
      setError(err);
      setEliminando(false);
    }
  }

  return (
    <Modal
      titulo={`Eliminar ${solicitud.codigo}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={eliminando}>Cancelar</Button>
          <Button variant="danger" icon="trash" loading={eliminando} onClick={confirmar}>Eliminar</Button>
        </>
      }
    >
      <div className="stack">
        {error ? <Alert tipo="error">{error.message}</Alert> : null}
        <p>
          ¿Eliminar {solicitud.codigo}? La solicitud dejará de aparecer en las listas, pero el cambio quedará
          registrado en el historial.
        </p>
      </div>
    </Modal>
  );
}
