import { useCatalogos } from '../../hooks/useApi.js';
import { BuscadorTexto } from './BuscadorTexto.jsx';
import { Button } from '../ui/componentes.jsx';

// HU09 · Búsqueda por texto y filtros por estado, prioridad y categoría. Se combinan entre sí
// (todas las condiciones deben cumplirse) y la API los aplica dentro del alcance del rol.
export function FiltrosSolicitudes({ valores, onCambiar, onLimpiar, hayFiltros, conTexto = true }) {
  const { datos: catalogos } = useCatalogos();

  const select = (campo, etiqueta, opciones) => (
    <select
      className="select filtro"
      aria-label={`Filtrar por ${etiqueta.toLowerCase()}`}
      value={valores[campo] ?? ''}
      onChange={(e) => onCambiar({ [campo]: e.target.value })}
    >
      <option value="">{etiqueta}: todos</option>
      {opciones.map(([v, t]) => (
        <option key={v} value={v}>{t}</option>
      ))}
    </select>
  );

  return (
    <div className="toolbar">
      {conTexto ? <BuscadorTexto value={valores.q} onChange={(q) => onCambiar({ q })} /> : null}
      {catalogos ? (
        <>
          {select('estado', 'Estado', catalogos.estados.map((e) => [e.codigo, e.codigo]))}
          {select('prioridad', 'Prioridad', catalogos.prioridades.map((p) => [p, p]))}
          {select('categoriaId', 'Categoría', catalogos.categorias.map((c) => [String(c.id), c.nombre]))}
        </>
      ) : null}
      {hayFiltros ? (
        <Button variant="ghost" size="sm" icon="x" onClick={onLimpiar}>
          Limpiar filtros
        </Button>
      ) : null}
    </div>
  );
}
