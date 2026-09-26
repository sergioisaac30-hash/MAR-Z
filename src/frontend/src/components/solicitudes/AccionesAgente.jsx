import { useState } from 'react';
import { solicitudesApi } from '../../api/cliente.js';
import { useCarga } from '../../hooks/useApi.js';
import { Alert, Button } from '../ui/componentes.jsx';

// HU07 · El agente asignado cambia el estado a uno de los destinos que permite su rol.
export function AccionesAgente({ solicitud, onCambiado }) {
  const { datos } = useCarga((signal) => solicitudesApi.transiciones(solicitud.id, { signal }), [solicitud.id, solicitud.estado]);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(null);

  if (!datos || datos.destinos.length === 0) return null;

  async function cambiar(destino) {
    setError(null);
    setEnviando(destino);
    try {
      const actualizada = await solicitudesApi.cambiarEstado(solicitud.id, { estado: destino });
      onCambiado(actualizada);
    } catch (err) {
      setError(err);
    } finally {
      setEnviando(null);
    }
  }

  return (
    <section className="panel">
      <div className="panel__header"><h2 className="panel__title">Cambiar estado</h2></div>
      <div className="panel__body stack" style={{ gap: 8 }}>
        {error ? <Alert tipo="error">{error.message}</Alert> : null}
        {datos.destinos.map((destino) => (
          <Button key={destino} block loading={enviando === destino} onClick={() => cambiar(destino)}>
            Pasar a «{destino}»
          </Button>
        ))}
      </div>
    </section>
  );
}
