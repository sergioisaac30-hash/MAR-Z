Reporte de pruebas · Sprint 1 (HU01–HU04)

Fecha de ejecución: 2026-09-23
Versión probada: Sprint-1-Cierre
Comando: npm test

Se realizaron las pruebas del Sprint 1, con un total de 57 pruebas, de las cuales 57 fueron correctas y 0 fallaron.

En el backend se realizaron 44 pruebas y en el frontend 13. También se hizo una prueba manual de punta a punta con una base de datos nueva y se comprobó que el frontend compila correctamente con npm run build.

HU01 · Inicio de sesión por roles

Se comprobó el inicio de sesión con credenciales válidas, el uso de cookies httpOnly y que el correo no distinga entre mayúsculas y minúsculas.

También se verificó el rechazo de contraseñas incorrectas, usuarios inexistentes o inactivos, datos incompletos, tokens manipulados y accesos a funciones de otros roles.

Además, se comprobó el cierre de sesión, la protección de las rutas, el uso de la cabecera anti-CSRF y que las contraseñas se almacenan mediante hash bcrypt.

HU02 · Crear solicitud

Se comprobó que título, descripción y categoría sean obligatorios y que no se puedan usar categorías inexistentes.

Al crear una solicitud, el sistema genera automáticamente el ID, la fecha, el estado Nuevo y el propietario. El usuario tampoco puede modificar estos datos desde el cliente.

La prioridad inicial queda en Media y la creación se registra en auditoría.

HU03 · Mis solicitudes

Se verificó que cada solicitante pueda ver únicamente sus propias solicitudes.

Al intentar abrir una solicitud de otro usuario mediante la URL, el sistema responde con 404 sin mostrar información.

También se comprobó el acceso al detalle de las solicitudes propias y que el listado muestre el estado y la última actualización.

HU04 · Panel del coordinador

Se comprobó que el coordinador pueda ver todas las solicitudes y modificar su prioridad entre Baja, Media y Alta.

Los cambios de prioridad quedan registrados indicando el usuario que realizó el cambio y los valores anterior y nuevo. Si se mantiene la misma prioridad, no se genera un nuevo evento.

También se verificó el ordenamiento por prioridad, estado y fecha, tanto ascendente como descendente, y que solo el coordinador pueda modificar la prioridad.

Prueba manual de punta a punta

Se probaron los inicios de sesión de solicitantes, coordinadores y agentes, incluyendo cuentas inactivas.

También se probó la creación de solicitudes, la validación de campos obligatorios, la consulta de solicitudes propias, el acceso a solicitudes de otros usuarios, el ordenamiento por prioridad y el cambio de prioridad.

Finalmente, se comprobó que un agente o solicitante no puedan modificar la prioridad.

Resultado final: todas las pruebas realizadas fueron correctas.