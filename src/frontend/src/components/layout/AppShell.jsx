import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx';
import { NAVEGACION } from '../../auth/roles.js';
import { iniciales } from '../../utils/format.js';
import { Icon } from '../ui/Icon.jsx';

// Logo de la aplicación: un rayo.
export function BrandMark({ className = 'brand__mark' }) {
  return (
    <svg className={className} viewBox="8 5 20 26" aria-hidden="true">
      <path d="M20 6 9.5 20h7l-1.5 10L26.5 16h-7L20 6z" fill="currentColor" />
    </svg>
  );
}

// Agrupa los enlaces de navegación por su grupo (Menú, Cuenta, etc.).
function agrupar(items) {
  return items.reduce((grupos, item) => {
    (grupos[item.grupo] ??= []).push(item);
    return grupos;
  }, {});
}

// Estructura general de la app: barra lateral, cabecera y contenido de la página actual.
export function AppShell() {
  const { usuario, logout } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => setAbierto(false), [location.pathname]);

  const items = NAVEGACION.filter((i) => i.roles.includes(usuario.rol));
  const actual = [...items].sort((a, b) => b.to.length - a.to.length).find((i) =>
    i.end ? location.pathname === i.to : location.pathname.startsWith(i.to),
  );

  // Cierra la sesión y vuelve al login.
  async function salir() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className={`shell ${abierto ? 'nav-open' : ''}`}>
      <aside className="sidebar" aria-label="Navegación principal">
        <div className="brand">
          <BrandMark />
          <div className="brand__name">Mesa de Solicitudes</div>
        </div>

        <nav className="nav">
          {Object.entries(agrupar(items)).map(([grupo, enlaces]) => (
            <div key={grupo}>
              <div className="nav__group">{grupo}</div>
              {enlaces.map((i) => (
                <NavLink key={i.etiqueta} to={i.to} end={i.end ?? i.to === '/solicitudes'} className="nav__link">
                  <Icon name={i.icono} size={18} />
                  {i.etiqueta}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>
      <div className="sidebar-backdrop" onClick={() => setAbierto(false)} />

      <div className="main">
        <header className="topbar">
          <button type="button" className="btn btn--ghost btn--icon topbar__menu" onClick={() => setAbierto(true)} aria-label="Abrir menú">
            <Icon name="menu" size={18} />
          </button>
          <div className="topbar__crumb">
            <span>{usuario.rolNombre}</span>
            <span className="topbar__sep">/</span>
            <strong>{actual?.etiqueta ?? 'Solicitudes'}</strong>
          </div>
          <div className="spacer" />
          <span className="user-chip" title={usuario.email}>
            <span className="avatar">{iniciales(usuario.nombre)}</span>
            <span className="user-chip__text">
              <span className="user-chip__name" style={{ display: 'block' }}>{usuario.nombre}</span>
              <span className="user-chip__role">{usuario.rolNombre}</span>
            </span>
          </span>
          <button type="button" className="btn btn--ghost btn--icon" onClick={salir} aria-label="Cerrar sesión" title="Cerrar sesión">
            <Icon name="logout" size={18} />
          </button>
        </header>
        <main className="content" id="contenido">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
