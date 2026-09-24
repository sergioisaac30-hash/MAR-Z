// HU01 · Tras iniciar sesión solo se redirige a rutas internas.
import { describe, expect, it } from 'vitest';
import { destinoSeguro } from '../pages/LoginPage.jsx';

describe('destinoSeguro', () => {
  it('acepta rutas internas', () => {
    expect(destinoSeguro('/solicitudes/3')).toBe('/solicitudes/3');
  });
  it.each(['//evil.test', '/\\evil.test', 'https://evil.test', undefined, 42])('rechaza %s', (valor) => {
    expect(destinoSeguro(valor)).toBe('/');
  });
});
