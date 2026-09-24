// HU03 / HU04 · Tabla: muestra estado y última actualización; permite ordenar.
// Escrito con React.createElement (sin JSX) para poder vivir en un archivo .js.
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SolicitudesTable } from '../components/solicitudes/SolicitudesTable.jsx';

const fila = {
  id: 1,
  codigo: 'SOL-00001',
  titulo: 'Lector sin conexión',
  categoria: { id: 1, nombre: 'Equipos de cómputo' },
  prioridad: 'Alta',
  estado: 'Nuevo',
  solicitante: { id: 1, nombre: 'Tú' },
  creadaEn: new Date().toISOString(),
  actualizadaEn: new Date().toISOString(),
};

describe('SolicitudesTable', () => {
  it('muestra código, estado y prioridad', () => {
    render(createElement(MemoryRouter, null, createElement(SolicitudesTable, { solicitudes: [fila] })));
    expect(screen.getByText('SOL-00001')).toBeTruthy();
    expect(screen.getByText('Nuevo')).toBeTruthy();
    expect(screen.getByText('Alta')).toBeTruthy();
    expect(screen.getByText('Última actualización')).toBeTruthy();
  });

  it('solicita ordenar por prioridad al pulsar el encabezado', () => {
    const onOrden = vi.fn();
    render(
      createElement(
        MemoryRouter,
        null,
        createElement(SolicitudesTable, { solicitudes: [fila], orden: 'fecha', dir: 'desc', onOrden }),
      ),
    );
    fireEvent.click(screen.getByTitle('Ordenar por prioridad'));
    expect(onOrden).toHaveBeenCalledWith('prioridad', 'desc');
  });
});
