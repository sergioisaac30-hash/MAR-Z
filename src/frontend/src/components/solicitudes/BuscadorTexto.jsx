import { useEffect, useState } from 'react';
import { Icon } from '../ui/Icon.jsx';

// HU08 · Búsqueda por texto en título y descripción (con una breve espera antes de buscar).
export function BuscadorTexto({ value, onChange, placeholder = 'Buscar por título o descripción…' }) {
  const [texto, setTexto] = useState(value ?? '');

  useEffect(() => setTexto(value ?? ''), [value]);

  useEffect(() => {
    const espera = setTimeout(() => {
      if (texto !== value) onChange(texto);
    }, 300);
    return () => clearTimeout(espera);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto]);

  return (
    <div className="search">
      <Icon name="search" size={16} />
      <input
        className="input"
        type="search"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder={placeholder}
        aria-label="Buscar solicitudes"
      />
    </div>
  );
}
