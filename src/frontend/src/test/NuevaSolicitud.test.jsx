// HU02 · Validación de campos obligatorios en el cliente.
import { describe, expect, it } from 'vitest';
import { validarSolicitud } from '../pages/NuevaSolicitudPage.jsx';

describe('validarSolicitud', () => {
  it('exige título, descripción y categoría', () => {
    expect(validarSolicitud({ titulo: ' ', descripcion: '', categoriaId: '', prioridad: 'Media' })).toEqual({
      titulo: 'El título es obligatorio.',
      descripcion: 'La descripción es obligatoria.',
      categoriaId: 'La categoría es obligatoria.',
    });
  });

  it('acepta una solicitud completa', () => {
    expect(validarSolicitud({ titulo: 'A', descripcion: 'B', categoriaId: '1', prioridad: 'Media' })).toEqual({});
  });
});
