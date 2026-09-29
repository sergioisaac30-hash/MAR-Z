# Mesa de Solicitudes

Aplicación web para registrar y gestionar solicitudes de soporte interno: los usuarios piden ayuda y un coordinador las prioriza. Esta versión corresponde al cierre del Sprint 1.

La aplicación arranca **sin solicitudes**: cada cuenta aparece vacía hasta que un solicitante crea la primera.

## Historias de usuario

| Sprint | HU | Descripción | Rol |
|--------|----|-------------|-----|
| 1 | HU01 | Inicio de sesión por roles | Todos |
| 1 | HU02 | Crear una solicitud de soporte | Solicitante |
| 1 | HU03 | Consultar mis solicitudes | Solicitante |
| 1 | HU04 | Ver, priorizar y ordenar solicitudes | Coordinador |

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
git checkout Sprint-1-Cierre
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

- Migraciones que usa la aplicación (Sprint 1): `src/backend/prisma/migrations/`
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
| Coordinador | `coordinador@mesa.test` | Priorización |
| Agente | `agente.uno@mesa.test` | Inicia sesión; sus funciones llegan en próximos sprints |
| Agente | `agente.dos@mesa.test` | Inicia sesión; sus funciones llegan en próximos sprints |
| Agente (inactivo) | `agente.tres@mesa.test` | No puede iniciar sesión |
| Auditor | `auditor@mesa.test` | Inicia sesión; sus funciones llegan en próximos sprints |

En modo desarrollo, la pantalla de login tiene un desplegable "Cuentas de prueba" para rellenar los datos con un clic.

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
| `eliminar-solicitud.test.js` | Eliminación lógica de solicitudes |

## Problemas comunes

- **"La operación viola una regla de integridad de los datos"** o **"The column ... does not exist"**: la base local es de otra versión. Ejecutar `npm run db:reset`.
- **El cliente de Prisma no coincide con el esquema** (por ejemplo, después de cambiar de tag): detener la aplicación y ejecutar `npx prisma generate` dentro de `src/backend/`.
- **Puerto ocupado**: cambiar `PORT` en `src/backend/.env`.
