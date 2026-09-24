import { cloneElement, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { Alert, Button, Field } from '../components/ui/componentes.jsx';
import { Icon } from '../components/ui/Icon.jsx';

// Cuentas ficticias de los datos semilla; solo se muestran en desarrollo.
const CUENTAS_DEMO = [
  ['Solicitante', 'solicitante.norte@mesa.test'],
  ['Coordinador', 'coordinador@mesa.test'],
  ['Agente', 'agente.uno@mesa.test'],
  ['Auditor', 'auditor@mesa.test'],
];

// Solo se permite volver a rutas internas (evita redirecciones abiertas como //sitio o /\\sitio).
export function destinoSeguro(desde) {
  return typeof desde === 'string' && /^\/(?![/\\])/.test(desde) ? desde : '/';
}

export default function LoginPage() {
  const { usuario, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [verClave, setVerClave] = useState(false);

  if (usuario) return <Navigate to="/" replace />;

  // Envía el formulario de inicio de sesión.
  async function enviar(e) {
    e.preventDefault();
    setError(null);
    if (!form.email.trim() || !form.password) {
      setError('Ingresa tu correo y contraseña.');
      return;
    }
    setEnviando(true);
    try {
      await login(form.email, form.password);
      navigate(destinoSeguro(location.state?.desde), { replace: true });
    } catch (err) {
      setError(err.message);
      setForm((f) => ({ ...f, password: '' }));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="login">
      <div className="login__card-outer">
        <aside className="login__illustration" aria-hidden="true">
          <IlustracionAcceso />
        </aside>

        <main className="login__form-side">
          <form className="login__form" onSubmit={enviar} noValidate>
            <div>
              <h1 className="login__title">¡Bienvenido de nuevo!</h1>
              <p className="login__subtitle">Ingresa para gestionar tus solicitudes de soporte.</p>
            </div>

            {error ? <Alert tipo="error">{error}</Alert> : null}

            <Field label="Correo electrónico">
              <input
                className="input"
                type="email"
                autoComplete="username"
                placeholder="Ingresa tu correo"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>

            <Field label="Contraseña">
              <InputConToggle>
                <input
                  className="input"
                  type={verClave ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Ingresa tu contraseña"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  className="input-icon__toggle"
                  onClick={() => setVerClave((v) => !v)}
                  aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <Icon name={verClave ? 'eyeOff' : 'eye'} size={16} />
                </button>
              </InputConToggle>
            </Field>

            <Button type="submit" variant="primary" block loading={enviando} style={{ height: 46 }}>
              Iniciar sesión
            </Button>

            {import.meta.env.DEV ? (
              <details className="demo-accounts">
                <summary>Cuentas de prueba (solo desarrollo)</summary>
                <ul>
                  {CUENTAS_DEMO.map(([rol, email]) => (
                    <li key={email}>
                      <button type="button" onClick={() => setForm({ email, password: 'Mesa2026!' })}>
                        <span>{rol}</span>
                        <span className="mono muted">{email}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </form>
        </main>
      </div>
    </div>
  );
}

// Campo con un botón a la derecha (mostrar/ocultar contraseña).
function InputConToggle({ children }) {
  const [input, ...resto] = children;
  return (
    <div className="input-icon input-icon--toggle-only">
      {cloneElement(input)}
      {resto}
    </div>
  );
}

// Ilustración decorativa del panel izquierdo: candado, escudo, cubos y figuras geométricas.
function IlustracionAcceso() {
  return (
    <svg viewBox="0 0 360 400" width="100%" height="100%" role="presentation">
      <defs>
        <linearGradient id="candadoGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b5bfd" />
          <stop offset="100%" stopColor="#2f45c9" />
        </linearGradient>
        <linearGradient id="pedestalGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e4f26b" />
          <stop offset="100%" stopColor="#c8d94a" />
        </linearGradient>
      </defs>

      {/* Anillo decorativo */}
      <circle cx="90" cy="90" r="34" fill="none" stroke="#b9cbe6" strokeWidth="10" opacity="0.7" />

      {/* Hexágono lima */}
      <polygon points="280,60 305,75 305,105 280,120 255,105 255,75" fill="#d9f26b" opacity="0.9" />

      {/* Cubos con contorno (wireframe) */}
      <g stroke="#8fa5cf" strokeWidth="1.6" fill="none" opacity="0.8">
        <rect x="35" y="230" width="34" height="34" />
        <path d="M35 230 L45 220 L79 220 L69 230 Z" />
        <path d="M69 230 L79 220 L79 254 L69 264 Z" />
        <rect x="270" y="240" width="26" height="26" />
        <path d="M270 240 L278 232 L304 232 L296 240 Z" />
        <path d="M296 240 L304 232 L304 258 L296 266 Z" />
      </g>

      {/* Pedestal cilíndrico lima */}
      <g>
        <ellipse cx="180" cy="330" rx="70" ry="16" fill="url(#pedestalGrad)" />
        <rect x="110" y="300" width="140" height="30" fill="url(#pedestalGrad)" />
        <ellipse cx="180" cy="300" rx="70" ry="16" fill="#e9f78c" />
      </g>

      {/* Escudo detrás del candado */}
      <path
        d="M180 120 L235 140 V190 C235 230 210 255 180 268 C150 255 125 230 125 190 V140 Z"
        fill="#2f45c9"
        opacity="0.18"
      />

      {/* Candado principal */}
      <g transform="translate(180 195)">
        <rect x="-58" y="-10" width="116" height="90" rx="16" fill="url(#candadoGrad)" />
        <path
          d="M-36 -10 V-38 a36 36 0 0 1 72 0 V-10"
          fill="none"
          stroke="#2f45c9"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d="M-36 -10 V-38 a36 36 0 0 1 72 0 V-10"
          fill="none"
          stroke="#5b78ff"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Ojo de la cerradura lima */}
        <circle cx="0" cy="24" r="13" fill="#d9f26b" />
        <rect x="-5" y="30" width="10" height="22" rx="4" fill="#d9f26b" />
        {/* Brillo */}
        <rect x="-46" y="0" width="14" height="60" rx="7" fill="#ffffff" opacity="0.18" />
      </g>
    </svg>
  );
}
