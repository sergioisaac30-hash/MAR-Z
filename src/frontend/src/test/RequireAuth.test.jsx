// HU01 · Protección de rutas del frontend por sesión y rol.
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const sesion = vi.hoisted(() => ({ actual: { usuario: null, cargando: false } }));
vi.mock('../auth/AuthContext.jsx', () => ({ useAuth: () => sesion.actual }));

const { RequireAuth } = await import('../auth/RequireAuth.jsx');

function montar(roles) {
  return render(
    <MemoryRouter initialEntries={['/privado']}>
      <Routes>
        <Route path="/login" element={<p>Pantalla de login</p>} />
        <Route path="/privado" element={<RequireAuth roles={roles}><p>Contenido privado</p></RequireAuth>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RequireAuth', () => {
  it('sin sesión redirige al login', () => {
    sesion.actual = { usuario: null, cargando: false };
    montar();
    expect(screen.getByText('Pantalla de login')).toBeTruthy();
  });

  it('con un rol no permitido muestra acceso no autorizado', () => {
    sesion.actual = { usuario: { rol: 'AUDITOR' }, cargando: false };
    montar(['COORDINADOR']);
    expect(screen.getByText('Acceso no autorizado')).toBeTruthy();
    expect(screen.queryByText('Contenido privado')).toBeNull();
  });

  it('con el rol permitido muestra el contenido', () => {
    sesion.actual = { usuario: { rol: 'COORDINADOR' }, cargando: false };
    montar(['COORDINADOR']);
    expect(screen.getByText('Contenido privado')).toBeTruthy();
  });
});
