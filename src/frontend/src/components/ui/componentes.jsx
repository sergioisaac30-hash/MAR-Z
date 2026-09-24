import { createContext, cloneElement, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import { slug } from '../../utils/format.js';
import { Icon } from './Icon.jsx';

// ─── Avisos flotantes (toasts) ────────────────────────────────────────────
const ToastContext = createContext(null);
let siguienteId = 1;

// Provee la función para mostrar avisos y los dibuja en pantalla.
export function ToastProvider({ children }) {
  const [avisos, setAvisos] = useState([]);

  const quitar = useCallback((id) => setAvisos((a) => a.filter((t) => t.id !== id)), []);
  const mostrar = useCallback(
    (mensaje, tipo = 'success') => {
      const id = siguienteId++;
      setAvisos((a) => [...a, { id, mensaje, tipo }]);
      setTimeout(() => quitar(id), 5000);
    },
    [quitar],
  );
  const api = useMemo(() => ({ exito: (m) => mostrar(m, 'success'), error: (m) => mostrar(m, 'error') }), [mostrar]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toasts" aria-live="polite">
        {avisos.map((t) => (
          <div key={t.id} className={`toast toast--${t.tipo}`}>
            <Icon name={t.tipo === 'error' ? 'alert' : 'check'} />
            <span style={{ flex: 1 }}>{t.mensaje}</span>
            <button type="button" className="btn btn--ghost btn--icon btn--sm" style={{ color: 'inherit', height: 20, width: 20 }} onClick={() => quitar(t.id)} aria-label="Cerrar aviso">
              <Icon name="x" size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

// ─── Mensajes de estado ───────────────────────────────────────────────────
const ICONOS_ALERTA = { error: 'alert', info: 'info', success: 'check', warning: 'alert' };

export function Alert({ tipo = 'info', children, titulo }) {
  return (
    <div className={`alert alert--${tipo}`} role={tipo === 'error' ? 'alert' : 'status'}>
      <Icon name={ICONOS_ALERTA[tipo]} />
      <div>
        {titulo ? <strong style={{ display: 'block' }}>{titulo}</strong> : null}
        {children}
      </div>
    </div>
  );
}

export function Loading({ texto = 'Cargando…' }) {
  return (
    <div className="loading" role="status">
      <span className="spinner" />
      {texto}
    </div>
  );
}

export function EmptyState({ icono = 'inbox', titulo, children, accion }) {
  return (
    <div className="empty">
      <div className="empty__icon">
        <Icon name={icono} size={18} />
      </div>
      <p className="empty__title">{titulo}</p>
      {children ? <p>{children}</p> : null}
      {accion ? <div style={{ marginTop: 14 }}>{accion}</div> : null}
    </div>
  );
}

export function ErrorState({ error, onReintentar }) {
  return (
    <div style={{ padding: 18 }}>
      <Alert tipo="error" titulo="No se pudo cargar la información">
        {error?.message}
        {onReintentar ? (
          <div style={{ marginTop: 8 }}>
            <button type="button" className="btn btn--secondary btn--sm" onClick={onReintentar}>
              Reintentar
            </button>
          </div>
        ) : null}
      </Alert>
    </div>
  );
}

// ─── Controles básicos ─────────────────────────────────────────────────────
export function Button({ variant = 'secondary', size, icon, loading, block, className = '', children, ...props }) {
  const clases = ['btn', `btn--${variant}`, size && `btn--${size}`, block && 'btn--block', !children && 'btn--icon', className]
    .filter(Boolean)
    .join(' ');
  return (
    <button type="button" className={clases} disabled={loading || props.disabled} {...props}>
      {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : icon ? <Icon name={icon} /> : null}
      {children}
    </button>
  );
}

// Campo de formulario accesible: etiqueta, ayuda y error asociados al control.
export function Field({ label, required, hint, error, counter, children, className = '' }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const control = cloneElement(children, {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': [hintId, errorId].filter(Boolean).join(' ') || undefined,
    'aria-required': required || undefined,
  });
  return (
    <div className={`field ${error ? 'field--invalid' : ''} ${className}`}>
      <label className="field__label" htmlFor={id}>
        <span>
          {label}
          {required ? <span className="field__req" aria-hidden="true">*</span> : null}
        </span>
        {counter ? <span className="field__counter">{counter}</span> : null}
      </label>
      {control}
      {hint && !error ? <span id={hintId} className="field__hint">{hint}</span> : null}
      {error ? <span id={errorId} className="field__error" role="alert">{error}</span> : null}
    </div>
  );
}

export function PageHeader({ eyebrow, titulo, descripcion, acciones, children }) {
  return (
    <header className="page-header">
      <div className="page-header__text">
        {eyebrow ? <div className="page-header__eyebrow">{eyebrow}</div> : null}
        <h1>{titulo}</h1>
        {descripcion ? <p className="page-header__desc">{descripcion}</p> : null}
        {children}
      </div>
      {acciones ? <div className="page-header__actions">{acciones}</div> : null}
    </header>
  );
}

// ─── Insignias ──────────────────────────────────────────────────────────────
export function StatusBadge({ estado }) {
  return (
    <span className={`badge badge--${slug(estado)}`}>
      <span className="badge__dot" aria-hidden="true" />
      {estado}
    </span>
  );
}

const ICONO_PRIORIDAD = { Alta: 'arrowUp', Media: 'minus', Baja: 'arrowDown' };

export function PriorityBadge({ prioridad }) {
  return (
    <span className={`priority priority--${slug(prioridad)}`} title={`Prioridad ${prioridad}`}>
      <Icon name={ICONO_PRIORIDAD[prioridad] ?? 'minus'} size={12} />
      {prioridad}
    </span>
  );
}

export function RoleBadge({ children }) {
  return <span className="badge badge--role">{children}</span>;
}

// ─── Ventana modal ──────────────────────────────────────────────────────────
export function Modal({ titulo, descripcion, onClose, children, footer }) {
  const tituloId = useId();
  const ref = useRef(null);

  useEffect(() => {
    const anterior = document.activeElement;
    ref.current?.querySelector('input, select, textarea, button:not([data-cerrar])')?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      anterior?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={tituloId} ref={ref}>
        <div className="modal__header">
          <div style={{ flex: 1 }}>
            <h2 id={tituloId} className="modal__title">{titulo}</h2>
            {descripcion ? <p className="muted" style={{ fontSize: 'var(--fs-sm)', marginTop: 2 }}>{descripcion}</p> : null}
          </div>
          <button type="button" className="btn btn--ghost btn--icon btn--sm" onClick={onClose} aria-label="Cerrar" data-cerrar>
            <Icon name="x" />
          </button>
        </div>
        <div className="modal__body">{children}</div>
        {footer ? <div className="modal__footer">{footer}</div> : null}
      </div>
    </div>
  );
}
