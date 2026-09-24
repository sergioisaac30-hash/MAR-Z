const fechaHora = new Intl.DateTimeFormat('es', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const soloFecha = new Intl.DateTimeFormat('es', { day: '2-digit', month: 'short', year: 'numeric' });
const relativo = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

// Fecha y hora legibles, en español.
export function formatFechaHora(valor) {
  if (!valor) return '—';
  return fechaHora.format(new Date(valor));
}

// Solo la fecha, legible, en español.
export function formatFecha(valor) {
  if (!valor) return '—';
  return soloFecha.format(new Date(valor));
}

const UNIDADES = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

// Tiempo relativo tipo "hace 3 horas".
export function formatRelativo(valor, ahora = Date.now()) {
  if (!valor) return '—';
  const segundos = (new Date(valor).getTime() - ahora) / 1000;
  for (const [unidad, s] of UNIDADES) {
    if (Math.abs(segundos) >= s) return relativo.format(Math.round(segundos / s), unidad);
  }
  return 'hace un momento';
}

// Iniciales de un nombre, para mostrar en un avatar.
export function iniciales(nombre = '') {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

// Convierte un texto en una clase CSS (sin acentos, en minúsculas, con guiones).
export function slug(texto = '') {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '-');
}
