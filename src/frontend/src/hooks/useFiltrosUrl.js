import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export const CLAVES_FILTRO = ['q', 'estado', 'prioridad', 'categoriaId'];

// HU09/HU10/HU12 · Filtros guardados en la URL: la misma dirección reproduce la misma consulta.
export function useFiltrosUrl() {
  const [params, setParams] = useSearchParams();

  const valores = useMemo(() => Object.fromEntries(params.entries()), [params]);

  const filtros = useMemo(
    () => Object.fromEntries(CLAVES_FILTRO.filter((k) => valores[k]).map((k) => [k, valores[k]])),
    [valores],
  );

  const actualizar = useCallback(
    (cambios) => {
      const siguiente = new URLSearchParams(params);
      for (const [k, v] of Object.entries(cambios)) (v ? siguiente.set(k, v) : siguiente.delete(k));
      setParams(siguiente, { replace: true });
    },
    [params, setParams],
  );

  const limpiar = useCallback(() => setParams({}, { replace: true }), [setParams]);

  return { valores, filtros, actualizar, limpiar, hayFiltros: Object.keys(filtros).length > 0 };
}
