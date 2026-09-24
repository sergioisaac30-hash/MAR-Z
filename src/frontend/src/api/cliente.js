const BASE = '/api';

// Error de la API: trae el código HTTP, el código de texto y los detalles por campo.
export class ApiError extends Error {
  constructor(status, codigo, mensaje, detalles = []) {
    super(mensaje);
    this.status = status;
    this.codigo = codigo;
    this.detalles = detalles;
  }

  // Errores de validación agrupados por campo, para mostrarlos junto a cada input.
  get porCampo() {
    return Object.fromEntries(this.detalles.map((d) => [d.campo, d.mensaje]));
  }
}

let alNoAutenticado = () => {};
// Registra qué hacer cuando la API responde 401 (sesión vencida o revocada).
export function onNoAutenticado(fn) {
  alNoAutenticado = fn;
}

// Arma la URL final con los parámetros de consulta, si los hay.
function construirUrl(ruta, query) {
  if (!query) return BASE + ruta;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== '') params.set(k, v);
  }
  const qs = params.toString();
  return BASE + ruta + (qs ? `?${qs}` : '');
}

// Llama a la API y devuelve los datos, o lanza un ApiError si algo falla.
export async function api(ruta, { method = 'GET', body, query, signal } = {}) {
  let res;
  try {
    res = await fetch(construirUrl(ruta, query), {
      method,
      credentials: 'same-origin',
      signal,
      headers: {
        Accept: 'application/json',
        // Cabecera anti-CSRF exigida por la API en peticiones que modifican datos.
        'X-Requested-With': 'MesaSolicitudes',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError(0, 'SIN_CONEXION', 'No fue posible conectar con el servidor.');
  }

  if (res.status === 204) return null;
  const esJson = (res.headers.get('content-type') ?? '').includes('application/json');
  const datos = esJson ? await res.json() : await res.text();

  if (!res.ok) {
    const e = esJson && datos?.error ? datos.error : {};
    const error = new ApiError(res.status, e.codigo ?? 'ERROR', e.mensaje ?? 'La operación no pudo completarse.', e.detalles);
    if (res.status === 401 && ruta !== '/auth/login') alNoAutenticado();
    throw error;
  }
  return datos;
}

export const get = (ruta, query, opts) => api(ruta, { ...opts, query });
export const post = (ruta, body) => api(ruta, { method: 'POST', body: body ?? {} });
export const patch = (ruta, body) => api(ruta, { method: 'PATCH', body });
export const del = (ruta) => api(ruta, { method: 'DELETE' });

// Endpoints de sesión (HU01).
export const authApi = {
  login: (email, password) => post('/auth/login', { email, password }),
  logout: () => post('/auth/logout'),
  me: () => get('/auth/me'),
};

// Catálogos del formulario: categorías, prioridades y estados.
export const catalogosApi = {
  obtener: () => get('/catalogos'),
};

// Endpoints de solicitudes (HU02, HU03, HU04).
export const solicitudesApi = {
  listar: (query, opts) => get('/solicitudes', query, opts),
  obtener: (id, opts) => get(`/solicitudes/${id}`, undefined, opts),
  crear: (datos) => post('/solicitudes', datos),
  cambiarPrioridad: (id, datos) => patch(`/solicitudes/${id}/prioridad`, datos),
  eliminar: (id) => del(`/solicitudes/${id}`),
};
