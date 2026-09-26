import { indicadoresApi } from '../api/cliente.js';
import { useCarga } from '../hooks/useApi.js';
import { useFiltrosUrl } from '../hooks/useFiltrosUrl.js';
import { BarrasHorizontales } from '../components/charts/BarrasHorizontales.jsx';
import { FiltrosSolicitudes } from '../components/solicitudes/FiltrosSolicitudes.jsx';
import { Alert, ErrorState, Loading, PageHeader } from '../components/ui/componentes.jsx';

const NOMBRE_EVENTO = {
  PRIORIDAD_CAMBIADA: 'Cambios de prioridad',
  ASIGNACION: 'Asignaciones',
  ESTADO_CAMBIADO: 'Cambios de estado',
  COMENTARIO_REGISTRADO: 'Comentarios',
  CONFIRMACION: 'Confirmaciones',
  REAPERTURA: 'Reaperturas',
};

// Expresa las horas del ciclo en la unidad más legible (horas o días).
function formatDuracion(horas) {
  if (horas === null || horas === undefined) return '—';
  if (horas < 48) return `${horas.toLocaleString('es', { maximumFractionDigits: 1 })} h`;
  return `${(horas / 24).toLocaleString('es', { maximumFractionDigits: 1 })} días`;
}

// HU10 · Indicadores agregados del servicio, con filtros reproducibles por estado, prioridad y categoría.
export default function IndicadoresPage() {
  const { valores, filtros, actualizar, limpiar, hayFiltros } = useFiltrosUrl();
  const { q: _sinTexto, ...filtrosIndicador } = filtros;
  const clave = JSON.stringify(filtrosIndicador);
  const { datos, error, cargando, recargar } = useCarga((signal) => indicadoresApi.obtener(filtrosIndicador, { signal }), [clave]);

  return (
    <>
      <PageHeader
        eyebrow="Gestión"
        titulo="Indicadores del servicio"
        descripcion="Cifras agregadas de todas las solicitudes. No incluyen datos ni comparaciones entre personas."
      />
      <section className="panel">
        <FiltrosSolicitudes valores={valores} conTexto={false} onCambiar={actualizar} onLimpiar={limpiar} hayFiltros={hayFiltros} />
      </section>

      {cargando && !datos ? <Loading /> : null}
      {error ? <ErrorState error={error} onReintentar={recargar} /> : null}

      {datos ? (
        <>
          <section className="panel">
            <div className="panel__header"><h2 className="panel__title">Tiempo mediano de ciclo</h2></div>
            <div className="panel__body">
              <span className="tile__value num">{formatDuracion(datos.tiempoMedianoCiclo.horas)}</span>{' '}
              <span className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
                {datos.tiempoMedianoCiclo.muestras
                  ? `sobre ${datos.tiempoMedianoCiclo.muestras} solicitud(es) cerrada(s)`
                  : 'no hay solicitudes cerradas con estos filtros'}
              </span>
            </div>
          </section>

          <BarrasHorizontales
            titulo="Volumen por estado"
            datos={datos.volumenPorEstado.map((v) => ({ etiqueta: v.estado, valor: v.cantidad }))}
          />
          <BarrasHorizontales
            titulo="Eventos registrados"
            datos={datos.eventosPorTipo.map((e) => ({ etiqueta: NOMBRE_EVENTO[e.accion] ?? e.accion, valor: e.cantidad }))}
          />

          <Alert tipo="info">Indicadores agregados por diseño: el sistema no mide desempeño individual ni ordena a las personas.</Alert>
        </>
      ) : null}
    </>
  );
}
