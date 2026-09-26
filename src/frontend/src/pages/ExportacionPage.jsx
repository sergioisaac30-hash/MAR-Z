import { useState } from 'react';
import { reportesApi, solicitudesApi } from '../api/cliente.js';
import { useCarga } from '../hooks/useApi.js';
import { useFiltrosUrl } from '../hooks/useFiltrosUrl.js';
import { FiltrosSolicitudes } from '../components/solicitudes/FiltrosSolicitudes.jsx';
import { Alert, Button, PageHeader, useToast } from '../components/ui/componentes.jsx';

// Descarga el CSV recibido como si fuera un archivo generado por el navegador.
function descargarArchivo(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// HU12 · Exportación CSV con los filtros aplicados; la exportación queda registrada.
export default function ExportacionPage() {
  const toast = useToast();
  const { valores, filtros, actualizar, limpiar, hayFiltros } = useFiltrosUrl();
  const clave = JSON.stringify(filtros);
  const vista = useCarga((signal) => solicitudesApi.listar(filtros, { signal }), [clave]);
  const [error, setError] = useState(null);
  const [exportando, setExportando] = useState(false);

  async function exportar() {
    setExportando(true);
    setError(null);
    try {
      const { blob, nombre, filas } = await reportesApi.exportarSolicitudes(filtros);
      descargarArchivo(blob, nombre);
      toast.exito(`${nombre} generado con ${filas} fila(s).`);
    } catch (err) {
      setError(err.message);
    } finally {
      setExportando(false);
    }
  }

  const filas = vista.datos?.datos.length;

  return (
    <>
      <PageHeader eyebrow="Gestión" titulo="Exportar reporte" descripcion="Genere un CSV de solicitudes según los filtros aplicados." />
      <section className="panel">
        <FiltrosSolicitudes valores={valores} onCambiar={actualizar} onLimpiar={limpiar} hayFiltros={hayFiltros} />
        <div className="panel__body row" style={{ justifyContent: 'space-between', gap: 16 }}>
          <span className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
            {filas ?? '—'} solicitud(es) se exportarán {hayFiltros ? 'con los filtros aplicados' : '(sin filtros)'}
          </span>
          <Button variant="primary" icon="download" loading={exportando} disabled={vista.cargando} onClick={exportar}>
            Exportar CSV
          </Button>
        </div>
        {error ? <div style={{ padding: '0 18px 18px' }}><Alert tipo="error">{error}</Alert></div> : null}
      </section>
    </>
  );
}
