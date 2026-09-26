// Fecha local del servidor en formato AAAA-MM-DD.
export function hoyLocal(ahora = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${ahora.getFullYear()}-${p(ahora.getMonth() + 1)}-${p(ahora.getDate())}`;
}

// Convierte AAAA-MM-DD en Date (medianoche UTC) para almacenarla.
export function fechaADate(fecha) {
  return fecha ? new Date(`${fecha}T00:00:00.000Z`) : null;
}

// Convierte una fecha almacenada en AAAA-MM-DD.
export function dateAFecha(date) {
  return date ? date.toISOString().slice(0, 10) : null;
}
