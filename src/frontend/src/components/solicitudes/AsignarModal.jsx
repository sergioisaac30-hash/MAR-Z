import { useState } from 'react';
import { agentesApi, solicitudesApi } from '../../api/cliente.js';
import { useCarga } from '../../hooks/useApi.js';
import { Alert, Button, ErrorState, Field, Loading, Modal } from '../ui/componentes.jsx';

// HU05 · Asignar (o reasignar) la solicitud a un agente activo.
export function AsignarModal({ solicitud, onClose, onAsignado }) {
  const agentes = useCarga((signal) => agentesApi.listar({ signal }).then((r) => r.datos), []);
  const [agenteId, setAgenteId] = useState(solicitud.asignacion?.agente.id ?? '');
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const sinCambios = !agenteId || Number(agenteId) === solicitud.asignacion?.agente.id;

  async function guardar(e) {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      const actualizada = await solicitudesApi.asignar(solicitud.id, { agenteId: Number(agenteId) });
      onAsignado(actualizada);
    } catch (err) {
      setError(err);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal
      titulo={solicitud.asignacion ? 'Reasignar solicitud' : 'Asignar solicitud'}
      descripcion={`${solicitud.codigo} · ${solicitud.titulo}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" type="submit" form="form-asignar" loading={guardando} disabled={sinCambios}>
            Asignar
          </Button>
        </>
      }
    >
      <form id="form-asignar" className="stack" onSubmit={guardar}>
        {error ? <Alert tipo="error">{error.message}</Alert> : null}
        {agentes.cargando ? <Loading /> : null}
        {agentes.error ? <ErrorState error={agentes.error} onReintentar={agentes.recargar} /> : null}
        {agentes.datos ? (
          <Field
            label="Agente"
            hint={
              solicitud.asignacion
                ? `Actualmente asignada a ${solicitud.asignacion.agente.nombre}.`
                : 'Solo se ofrecen agentes con estado Activo.'
            }
          >
            <select className="select" value={agenteId} onChange={(e) => setAgenteId(e.target.value)}>
              <option value="">Seleccione…</option>
              {agentes.datos.map((a) => (
                <option key={a.id} value={a.id}>{a.nombre}</option>
              ))}
            </select>
          </Field>
        ) : null}
      </form>
    </Modal>
  );
}
