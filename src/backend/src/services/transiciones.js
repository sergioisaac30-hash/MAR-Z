import { conflict } from '../middleware/errorHandler.js';

// HU07 · Estados destino permitidos desde `origen` para un rol, según la tabla transiciones_estado.
export async function destinosPermitidos(client, origen, rolCodigo) {
  const filas = await client.transicionEstado.findMany({
    where: { estadoOrigenId: origen, rol: { codigo: rolCodigo } },
    include: { estadoDestino: true },
    orderBy: { estadoDestino: { orden: 'asc' } },
  });
  return filas.map((t) => t.estadoDestinoId);
}

// HU07 · Rechaza cualquier transición que no esté registrada para el rol; no modifica nada.
export async function exigirTransicion(client, origen, destino, rolCodigo) {
  const permitidos = await destinosPermitidos(client, origen, rolCodigo);
  if (!permitidos.includes(destino)) {
    throw conflict('TRANSICION_INVALIDA', `No se permite pasar de "${origen}" a "${destino}".`, [
      {
        campo: 'estado',
        mensaje: permitidos.length
          ? `Desde "${origen}" solo se permite: ${permitidos.join(', ')}.`
          : `Desde "${origen}" no hay transiciones disponibles para su rol.`,
      },
    ]);
  }
}
