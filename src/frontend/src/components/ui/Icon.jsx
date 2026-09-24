// Conjunto mínimo de iconos de trazo (24×24) para no depender de librerías externas.
const PATHS = {
  grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>,
  inbox: <><path d="M3.5 13.5h5l1.5 2.5h4l1.5-2.5h5" /><path d="M5.5 5.5h13l2 8v5a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1v-5z" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  flag: <><path d="M5 21V4" /><path d="M5 4.5h11l-2 4 2 4H5" /></>,
  user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" /></>,
  logout: <><path d="M14 4.5h4a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5h-4" /><path d="M10 16l-4-4 4-4M6 12h9" /></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  x: <><path d="M6 6l12 12M18 6 6 18" /></>,
  check: <><path d="m5 12.5 4.5 4.5L19 7.5" /></>,
  minus: <><path d="M6 12h12" /></>,
  alert: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5v5M12 16h.01" /></>,
  info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8h.01" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  arrowLeft: <><path d="M19 12H5M11 6l-6 6 6 6" /></>,
  arrowUp: <><path d="M12 19V5M6 11l6-6 6 6" /></>,
  arrowDown: <><path d="M12 5v14M6 13l6 6 6-6" /></>,
  sort: <><path d="M8 5v14M5 16l3 3 3-3M16 19V5M13 8l3-3 3 3" /></>,
  chevronRight: <><path d="m9 6 6 6-6 6" /></>,
  search: <><circle cx="11" cy="11" r="6" /><path d="m20 20-4.5-4.5" /></>,
  shield: <><path d="M12 3.5 19 6v5.5c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6z" /><path d="m9 12 2 2 4-4" /></>,
  lock: <><rect x="5" y="10.5" width="14" height="10" rx="1.5" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></>,
  mail: <><rect x="3.5" y="5.5" width="17" height="13" rx="2" /><path d="m4 7 8 6 8-6" /></>,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></>,
  eyeOff: <><path d="M3 3l18 18" /><path d="M10.6 5.6A9.8 9.8 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3.1 3.9M6.6 6.6C4 8.3 2.5 12 2.5 12S6 18.5 12 18.5c1.7 0 3.2-.5 4.5-1.2" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
  trash: <><path d="M4.5 7h15" /><path d="M9.5 7V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v2" /><path d="M6.5 7l1 12.5A1.5 1.5 0 0 0 9 21h6a1.5 1.5 0 0 0 1.5-1.5L17.5 7" /><path d="M10 11v6M14 11v6" /></>,
};

// Icono en SVG a partir de su nombre; si no existe se usa uno genérico.
export function Icon({ name, size = 16, className, title }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title ? <title>{title}</title> : null}
      {PATHS[name] ?? PATHS.info}
    </svg>
  );
}
