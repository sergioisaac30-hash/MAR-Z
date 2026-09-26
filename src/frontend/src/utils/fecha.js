// Fecha local del navegador en formato AAAA-MM-DD, para el input type="date".
export function hoyLocal() {
  const ahora = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${ahora.getFullYear()}-${p(ahora.getMonth() + 1)}-${p(ahora.getDate())}`;
}
