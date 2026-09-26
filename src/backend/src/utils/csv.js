// Neutraliza fórmulas al abrir el CSV en una hoja de cálculo (inyección de fórmulas).
function neutralizar(texto) {
  return /^[=+\-@\t\r]/.test(texto) ? `'${texto}` : texto;
}

// Convierte un valor en una celda CSV válida: escapa comillas y envuelve si hace falta.
export function celdaCsv(valor) {
  if (valor === null || valor === undefined) return '';
  const texto = neutralizar(String(valor));
  return /[",\r\n;]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

// CSV RFC 4180 (coma, CRLF) con BOM UTF-8 para que las hojas de cálculo respeten los acentos.
export function generarCsv(columnas, filas) {
  const lineas = [columnas.map(celdaCsv).join(','), ...filas.map((f) => f.map(celdaCsv).join(','))];
  return `﻿${lineas.join('\r\n')}\r\n`;
}
