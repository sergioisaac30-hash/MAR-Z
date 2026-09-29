# Mesa de Solicitudes

Aplicación web para registrar y gestionar solicitudes de soporte interno: los usuarios piden ayuda, un coordinador organiza y asigna el trabajo, los agentes lo atienden y un auditor revisa el historial.

La aplicación arranca **sin solicitudes**: cada cuenta aparece vacía hasta que un solicitante crea la primera.

## Historias de usuario

| Sprint | HU | Descripción | Rol |
|--------|----|-------------|-----|
| 1 | HU01 | Inicio de sesión por roles | Todos |
| 1 | HU02 | Crear una solicitud de soporte | Solicitante |
| 1 | HU03 | Consultar mis solicitudes | Solicitante |
| 1 | HU04 | Ver, priorizar y ordenar solicitudes | Coordinador |
| 2 | HU05 | Asignar una solicitud a un agente (con notificación) | Coordinador |
| 2 | HU06 | Registrar comentarios de trabajo | Agente |
| 2 | HU07 | Cambiar el estado de una solicitud | Agente |
| 2 | HU08 | Confirmar o reabrir la solución | Solicitante |
| 3 | HU09 | Buscar y filtrar solicitudes | Solicitante, Agente, Coordinador |
| 3 | HU10 | Indicadores del servicio | Coordinador |
| 3 | HU11 | Historial de auditoría | Auditor |
| 3 | HU12 | Exportar reporte CSV | Coordinador |

Cambios controlados:

- **CAM-01 (Sprint 2):** una solicitud con prioridad Alta necesita justificación y fecha objetivo, al crearla y al priorizarla.
- **CAM-02 (Sprint 3):** el auditor solo puede leer el historial, y los reportes exportados excluyen el texto libre.

## Estructura del repositorio

```
README.md       instrucciones de instalación y ejecución
docs/           reportes de pruebas y documentación de cada sprint
database/       scripts SQL de cada sprint
src/
  backend/      API (Express + Prisma), migraciones, datos semilla y pruebas
  frontend/     interfaz web (React + Vite)
```

## Tecnologías

- **Backend:** Node.js, Express, Prisma ORM, Zod, JWT en cookie httpOnly.
- **Base de datos:** SQLite (archivo local, no requiere instalar un servidor).
- **Frontend:** React + Vite.
- **Pruebas:** Vitest y Supertest.

## Requisitos

- Node.js 20.12 o superior (probado con Node 22).
- npm 10 o superior.
- Git.

## Instalación

```bash
git clone https://github.com/sergioisaac30-hash/MAR-Z.git
cd MAR-Z
npm install
```

`npm install` instala las dependencias del backend y del frontend (el proyecto usa workspaces) y genera el cliente de Prisma.

Para revisar el estado exacto de un sprint, cambiar al tag correspondiente antes de instalar:

```bash
git checkout Sprint-3-Cierre
```

### Variables de entorno

```bash
cp src/backend/.env.example src/backend/.env
```

En Windows (PowerShell): `Copy-Item src/backend/.env.example src/backend/.env`

| Variable | Uso | Valor sugerido |
|----------|-----|----------------|
| `DATABASE_URL` | Ruta de la base SQLite (relativa a `src/backend/prisma`) | `file:./data/mesa.db` |
| `JWT_SECRET` | Secreto para firmar la sesión (mínimo 32 caracteres) | cualquier texto largo |
| `PORT` | Puerto de la API | `4000` |

Si `JWT_SECRET` no se define, en desarrollo se usa uno temporal y las sesiones se cierran al reiniciar el servidor.

## Base de datos

Crear la base, aplicar las migraciones y crear los usuarios de prueba:

```bash
npm run db:migrate
npm run db:seed
```

Para empezar de cero (borra la base local y vuelve a crear los usuarios de prueba):

```bash
npm run db:reset
```

Dónde está cada cosa:

- Migraciones que usa la aplicación (una por sprint): `src/backend/prisma/migrations/`
- Modelo de datos: `src/backend/prisma/schema.prisma`
- Datos semilla: `src/backend/src/db/seed.js`. Solo crea los usuarios de prueba; las pruebas automáticas cargan sus propias solicitudes en una base temporal.
- Scripts SQL de cada sprint en `database/`, para revisar o cargar la base sin Node:
  `sqlite3 mesa.db < database/<archivo>.sql`

## Ejecución

Modo desarrollo (levanta API y frontend a la vez):

```bash
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:4000/api

Modo producción (la API sirve el frontend compilado):

```bash
npm run build
npm start
```

Luego abrir http://localhost:4000

## Usuarios de prueba

Todos los datos son ficticios. La contraseña de todas las cuentas es `Mesa2026!`.

| Rol | Correo | Menú |
|-----|--------|------|
| Solicitante | `solicitante.norte@mesa.test` | Mis solicitudes · Nueva solicitud |
| Solicitante | `solicitante.sur@mesa.test` | Mis solicitudes · Nueva solicitud |
| Coordinador | `coordinador@mesa.test` | Priorización · Indicadores · Exportar |
| Agente | `agente.uno@mesa.test` | Asignadas a mí |
| Agente | `agente.dos@mesa.test` | Asignadas a mí |
| Agente (inactivo) | `agente.tres@mesa.test` | No puede iniciar sesión |
| Auditor | `auditor@mesa.test` | Historial de cambios |

En modo desarrollo, la pantalla de login tiene un desplegable "Cuentas de prueba" para rellenar los datos con un clic.

## Flujo de estados

```
Nuevo → Asignada            (coordinador, al asignar)
Asignada → En progreso      (agente)
En progreso ⇄ En espera     (agente)
En progreso → Resuelta      (agente)
Resuelta → Cerrada          (solicitante confirma)
Resuelta → Reabierta        (solicitante, con motivo)
Reabierta → En progreso     (agente)
```

## Pruebas

```bash
npm test
```

Ejecuta las pruebas del backend (una base SQLite temporal por archivo) y del frontend. Las pruebas del backend están en `src/backend/tests/` y las del frontend en `src/frontend/src/test/`.

| Archivo | Qué comprueba |
|---------|---------------|
| `pa01-login.test.js` | HU01: login, cierre de sesión, permisos por rol, seguridad |
| `pa02-crear-solicitud.test.js` | HU02: creación y validaciones |
| `pa03-mis-solicitudes.test.js` | HU03: cada solicitante ve solo lo suyo |
| `pa04-priorizar.test.js` | HU04: cambio de prioridad y ordenamiento |
| `pa05-asignar.test.js` | HU05: asignación, agentes activos y notificaciones |
| `pa06-comentarios.test.js` | HU06: comentarios y su visibilidad |
| `pa07-cambiar-estado.test.js` | HU07: transiciones válidas e historial |
| `pa08-confirmar-reabrir.test.js` | HU08: confirmar y reabrir con motivo |
| `pa09-buscar-filtrar.test.js` | HU09: búsqueda por texto y filtros combinados |
| `pa10-indicadores.test.js` | HU10: indicadores agregados |
| `pa11-auditoria.test.js` | HU11: historial de auditoría |
| `pa12-exportar.test.js` | HU12: exportación CSV |
| `cam01-prioridad-alta.test.js` | CAM-01: prioridad Alta con justificación y fecha objetivo |
| `cam02-auditor-solo-lectura.test.js` | CAM-02: auditor en solo lectura |
| `eliminar-solicitud.test.js` | Eliminación lógica de solicitudes |
| `regresion-flujo-completo.test.js` | Recorrido completo de HU01 a HU12 |

## Problemas comunes

- **"La operación viola una regla de integridad de los datos"** o **"The column ... does not exist"**: la base local es de otra versión. Ejecutar `npm run db:reset`.
- **El cliente de Prisma no coincide con el esquema** (por ejemplo, después de cambiar de tag): detener la aplicación y ejecutar `npx prisma generate` dentro de `src/backend/`.
- **Puerto ocupado**: cambiar `PORT` en `src/backend/.env`.
