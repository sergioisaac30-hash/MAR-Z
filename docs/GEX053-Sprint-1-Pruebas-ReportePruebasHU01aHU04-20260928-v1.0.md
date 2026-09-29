# Reporte de pruebas · Sprint 1 (HU01–HU04)

Fecha de ejecución: 2026-09-28
Versión probada: tag `Sprint-1-Cierre`
Comando: `npm test`

## Resumen

| Conjunto | Archivos | Pruebas | Resultado |
|----------|----------|---------|-----------|
| Backend (API) | 5 | 44 | 44 correctas |
| Frontend | 4 | 13 | 13 correctas |
| **Total** | **9** | **57** | **57 correctas, 0 fallidas** |

Además se hizo una prueba manual de punta a punta sobre una base nueva (migraciones + datos semilla) y se comprobó que el frontend compila (`npm run build`).

## HU01 · Inicio de sesión por roles (`pa01-login.test.js`)

- CA1: credenciales válidas permiten el acceso y emiten una cookie httpOnly.
- CA1: el correo no distingue mayúsculas.
- CA2: contraseña incorrecta, usuario inexistente y usuario inactivo reciben la misma respuesta.
- CA2: datos de login incompletos se rechazan con validación.
- CA3: la sesión puede cerrarse y el token deja de ser válido en el servidor.
- CA3: sin sesión, las rutas protegidas responden 401.
- CA3: un token manipulado es rechazado.
- CA4: un usuario no puede acceder a funciones de otro rol.
- Seguridad: las peticiones que modifican datos exigen la cabecera anti-CSRF.
- Seguridad: las contraseñas se guardan con hash bcrypt y la base rechaza texto plano.

## HU02 · Crear solicitud (`pa02-crear-solicitud.test.js`)

- Título, descripción y categoría son obligatorios.
- CA3: una categoría inexistente se rechaza.
- CA4–CA7: el sistema genera ID y fecha, estado inicial "Nuevo" y el propietario es el usuario autenticado.
- CA6–CA7: el cliente no puede imponer estado, propietario ni fechas.
- La prioridad inicial por defecto es Media.
- La creación queda registrada en auditoría.

## HU03 · Mis solicitudes (`pa03-mis-solicitudes.test.js`)

- CA1: el solicitante solo ve sus propias solicitudes.
- CA1: abrir por URL una solicitud ajena responde 404 sin revelarla.
- CA2: puede abrir el detalle de una solicitud propia.
- CA3–CA4: el listado muestra estado y última actualización.

## HU04 · Panel del coordinador (`pa04-priorizar.test.js`)

- El coordinador ve todas las solicitudes.
- CA1: la prioridad debe ser válida (Baja, Media, Alta).
- CA2: el cambio queda trazable (actor, valor anterior y nuevo); repetir la misma prioridad no genera evento.
- CA3: la lista se ordena por prioridad, estado o fecha (ascendente y descendente).
- CA4: solo el coordinador puede modificar la prioridad.

## Prueba manual de punta a punta (API)

| Caso | Resultado esperado | Obtenido |
|------|--------------------|----------|
| Login solicitante, coordinador, agente | 200 con datos del usuario | OK |
| Login con cuenta inactiva | Mensaje genérico de error | OK |
| Solicitante crea una solicitud | Se crea con código SOL-xxxxx, estado Nuevo, prioridad Media | OK |
| Crear sin título | 400 | OK |
| Solicitante Norte lista sus solicitudes | Solo ve las suyas | OK |
| Solicitante Norte abre una de Sur | 404 | OK |
| Coordinador ordena por prioridad | Alta → Media → Baja | OK |
| Coordinador cambia prioridad a Alta | La solicitud sube en la lista | OK |
| Agente o solicitante intentan cambiar prioridad | 403 | OK |
