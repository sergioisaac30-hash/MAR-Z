import { useState } from 'react';
import { solicitudesApi } from '../../api/cliente.js';
import { hoyLocal } from '../../utils/fecha.js';
import { Alert, Button, Field, Modal } from '../ui/componentes.jsx';
import { CamposPrioridadAlta } from './CamposPrioridadAlta.jsx';
import { PrioridadSelector } from './PrioridadSelector.jsx';

// Cambio 1 (CAM-01): validación local equivalente a la del servidor.
function validar(prioridad, justificacion, fecha) {
  if (prioridad !== 'Alta') return {};
  const errores = {};
  if (!justificacion.trim()) errores.justificacionPrioridad = 'La prioridad Alta requiere una justificación.';
  if (!fecha) errores.fechaObjetivo = 'La prioridad Alta requiere una fecha objetivo.';
  else if (fecha < hoyLocal()) errores.fechaObjetivo = 'La fecha objetivo no puede ser anterior a hoy.';
  return errores;
}

// HU04 (+ CAM-01) · Cambio de prioridad por el coordinador; queda registrado en auditoría.
export function PrioridadModal({ solicitud, onClose, onGuardado }) {
  const [prioridad, setPrioridadValor] = useState(solicitud.prioridad);
  const [justificacion, setJustificacion] = useState(solicitud.justificacionPrioridad ?? '');
  const [fecha, setFecha] = useState(solicitud.fechaObjetivo ?? '');
  const [errores, setErrores] = useState({});
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const sinCambios = prioridad === solicitud.prioridad && justificacion === (solicitud.justificacionPrioridad ?? '') && fecha === (solicitud.fechaObjetivo ?? '');

  // Al bajar de Alta a otra prioridad se descartan la justificación y la fecha objetivo.
  function cambiarPrioridad(nueva) {
    setPrioridadValor(nueva);
    if (nueva !== 'Alta') {
      setJustificacion('');
      setFecha('');
    }
  }

  async function guardar(e) {
    e.preventDefault();
    setError(null);
    const locales = validar(prioridad, justificacion, fecha);
    setErrores(locales);
    if (Object.keys(locales).length) return;

    setGuardando(true);
    try {
      const actualizada = await solicitudesApi.cambiarPrioridad(solicitud.id, {
        prioridad,
        justificacionPrioridad: prioridad === 'Alta' ? justificacion : undefined,
        fechaObjetivo: prioridad === 'Alta' ? fecha : undefined,
      });
      onGuardado(actualizada);
    } catch (err) {
      setErrores(err.porCampo ?? {});
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
          <PrioridadSelector value={prioridad} onChange={cambiarPrioridad} />
        </Field>
        {prioridad === 'Alta' ? (
          <div className="form-grid">
            <CamposPrioridadAlta
              justificacion={justificacion}
              fecha={fecha}
              onJustificacion={setJustificacion}
              onFecha={setFecha}
              errores={errores}
            />
          </div>
        ) : null}
      </form>
    </Modal>
  );
}
