import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { solicitudesApi } from '../api/cliente.js';
import { useCatalogos } from '../hooks/useApi.js';
import { PrioridadSelector } from '../components/solicitudes/PrioridadSelector.jsx';
import { Alert, Button, ErrorState, Field, Loading, PageHeader, useToast } from '../components/ui/componentes.jsx';

const LIMITES = { titulo: 150, descripcion: 4000 };
const INICIAL = { titulo: '', descripcion: '', categoriaId: '', prioridad: 'Media' };

// Validación en cliente equivalente a la del servidor (el servidor siempre revalida).
export function validarSolicitud(form) {
  const errores = {};
  if (!form.titulo.trim()) errores.titulo = 'El título es obligatorio.';
  if (!form.descripcion.trim()) errores.descripcion = 'La descripción es obligatoria.';
  if (!form.categoriaId) errores.categoriaId = 'La categoría es obligatoria.';
  return errores;
}

// HU02 · Crear solicitud.
export default function NuevaSolicitudPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const catalogos = useCatalogos();
  const [form, setForm] = useState(INICIAL);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e?.target ? e.target.value : e }));

  // Envía el formulario de nueva solicitud.
  async function enviar(e) {
    e.preventDefault();
    setErrorGeneral(null);
    const locales = validarSolicitud(form);
    setErrores(locales);
    if (Object.keys(locales).length) return;

    setEnviando(true);
    try {
      const creada = await solicitudesApi.crear({
        titulo: form.titulo,
        descripcion: form.descripcion,
        categoriaId: Number(form.categoriaId),
        prioridad: form.prioridad,
      });
      toast.exito(`Solicitud ${creada.codigo} registrada.`);
      navigate(`/solicitudes/${creada.id}`);
    } catch (err) {
      setErrores(err.porCampo ?? {});
      setErrorGeneral(err.message);
    } finally {
      setEnviando(false);
    }
  }

  if (catalogos.cargando) return <Loading />;
  if (catalogos.error) return <ErrorState error={catalogos.error} onReintentar={catalogos.recargar} />;

  return (
    <>
      <PageHeader
        eyebrow="Solicitudes"
        titulo="Nueva solicitud"
        descripcion="Describa el problema con el detalle suficiente para atenderlo. El código, la fecha y el estado inicial se asignan automáticamente."
      />
      <form className="panel" onSubmit={enviar} noValidate style={{ maxWidth: 860 }}>
        <div className="panel__body form-grid">
          {errorGeneral ? <div className="span-2"><Alert tipo="error">{errorGeneral}</Alert></div> : null}
          <Field
            className="span-2"
            label="Título"
            required
            error={errores.titulo}
            counter={`${form.titulo.length}/${LIMITES.titulo}`}
            hint="Resumen breve, p. ej. «Impresora de etiquetas sin conexión en línea 2»."
          >
            <input className="input" value={form.titulo} maxLength={LIMITES.titulo} onChange={set('titulo')} />
          </Field>
          <Field label="Categoría" required error={errores.categoriaId}>
            <select className="select" value={form.categoriaId} onChange={set('categoriaId')}>
              <option value="">Seleccione…</option>
              {catalogos.datos.categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </Field>
          <Field label="Prioridad sugerida" hint="El coordinador puede ajustarla." error={errores.prioridad}>
            <PrioridadSelector value={form.prioridad} onChange={set('prioridad')} />
          </Field>
          <Field
            className="span-2"
            label="Descripción"
            required
            error={errores.descripcion}
            counter={`${form.descripcion.length}/${LIMITES.descripcion}`}
            hint="Qué ocurre, desde cuándo, dónde y a quién afecta."
          >
            <textarea className="textarea" rows={7} value={form.descripcion} maxLength={LIMITES.descripcion} onChange={set('descripcion')} />
          </Field>
        </div>
        <div className="panel__footer form-actions">
          <Button variant="ghost" onClick={() => navigate(-1)}>Cancelar</Button>
          <Button type="submit" variant="primary" loading={enviando}>Registrar solicitud</Button>
        </div>
      </form>
    </>
  );
}
