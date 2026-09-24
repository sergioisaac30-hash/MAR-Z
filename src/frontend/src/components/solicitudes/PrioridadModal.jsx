import { useState } from 'react';
import { solicitudesApi } from '../../api/cliente.js';
import { Alert, Button, Field, Modal } from '../ui/componentes.jsx';
import { PrioridadSelector } from './PrioridadSelector.jsx';

// HU04 · Cambio de prioridad por el coordinador; queda registrado en auditoría.
export function PrioridadModal({ solicitud, onClose, onGuardado }) {
  const [prioridad, setPrioridad] = useState(solicitud.prioridad);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const sinCambios = prioridad === solicitud.prioridad;

  async function guardar(e) {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      const actualizada = await solicitudesApi.cambiarPrioridad(solicitud.id, { prioridad });
      onGuardado(actualizada);
    } catch (err) {
      setError(err);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal
      titulo="Cambiar prioridad"
      descripcion={`${solicitud.codigo} · ${solicitud.titulo}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" type="submit" form="form-prioridad" loading={guardando} disabled={sinCambios}>
            Guardar prioridad
          </Button>
        </>
      }
    >
      <form id="form-prioridad" className="stack" onSubmit={guardar}>
        {error ? <Alert tipo="error">{error.message}</Alert> : null}
        <Field label="Prioridad" hint={`Actual: ${solicitud.prioridad}. El cambio quedará registrado en el historial.`}>
          <PrioridadSelector value={prioridad} onChange={setPrioridad} />
        </Field>
      </form>
    </Modal>
  );
}
