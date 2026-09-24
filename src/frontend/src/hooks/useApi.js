import { useCallback, useEffect, useRef, useState } from 'react';
import { catalogosApi } from '../api/cliente.js';

/**
 * Ejecuta una carga asíncrona dependiente de `deps`, cancela la anterior al cambiar
 * y expone { datos, error, cargando, recargar }.
 */
export function useCarga(cargar, deps) {
  const [estado, setEstado] = useState({ datos: null, error: null, cargando: true });
  const [version, setVersion] = useState(0);
  const cargarRef = useRef(cargar);
  cargarRef.current = cargar;

  useEffect(() => {
    const control = new AbortController();
    setEstado((e) => ({ ...e, cargando: true, error: null }));
    cargarRef
      .current(control.signal)
      .then((datos) => !control.signal.aborted && setEstado({ datos, error: null, cargando: false }))
      .catch((error) => {
        if (error.name !== 'AbortError' && !control.signal.aborted) setEstado({ datos: null, error, cargando: false });
      });
    return () => control.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version]);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);
  return { ...estado, recargar };
}

let cacheCatalogos = null;

// Catálogos (categorías, prioridades, estados); se piden una sola vez por sesión del navegador.
export function useCatalogos() {
  return useCarga(() => {
    cacheCatalogos ??= catalogosApi.obtener().catch((e) => {
      cacheCatalogos = null;
      throw e;
    });
    return cacheCatalogos;
  }, []);
}
