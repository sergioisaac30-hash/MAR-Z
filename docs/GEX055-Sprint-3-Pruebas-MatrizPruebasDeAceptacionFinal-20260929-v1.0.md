Matriz de pruebas de aceptación final · PA-01 a PA-12

Proyecto: Mesa de Solicitudes · Sprint 3 (cierre del proyecto)
Fecha de ejecución: 2026-09-30
Versión probada: Sprint-3-Cierre
Comando: npm test con instalación limpia usando npm ci

Se realizaron 138 pruebas, de las cuales 138 fueron correctas y 0 fallaron.

En el backend se realizaron 125 pruebas y en el frontend 13.

Pruebas de aceptación

PA-01 · HU01 Inicio de sesión por roles: Se validaron las credenciales, cookies httpOnly, cierre de sesión, rutas protegidas, tokens manipulados, permisos por rol, anti-CSRF y contraseñas con bcrypt. Aprobada.

PA-02 · HU02 Crear solicitud: Se comprobó la categoría, generación automática de ID, fecha, estado Nuevo, propietario, prioridad Media y registro en auditoría. Aprobada.

PA-03 · HU03 Mis solicitudes: Se verificó que el usuario solo pueda consultar sus solicitudes, incluso mediante URL, además del detalle, estado y última actualización. Aprobada.

PA-04 · HU04 Priorizar: Se validaron las prioridades, el registro de cambios, el ordenamiento y que solo el coordinador pueda modificar la prioridad. Aprobada.

PA-05 · HU05 Asignar: Se comprobó la asignación únicamente a agentes activos, las notificaciones, los rechazos correspondientes y la reasignación manteniendo una sola asignación vigente. Aprobada.

PA-06 · HU06 Comentarios: Se verificó que los comentarios no estén vacíos, que autor y fecha sean establecidos por el servidor, que no puedan editarse ni eliminarse y que tengan visibilidad restringida. Aprobada.

PA-07 · HU07 Cambiar estado: Se comprobó el flujo de estados, el historial de cambios y el rechazo de transiciones inválidas. El agente no puede cerrar ni reabrir solicitudes. Aprobada.

PA-08 · HU08 Confirmar o reabrir: Se verificó la confirmación de solicitudes resueltas, la reapertura con motivo obligatorio y el registro de estas acciones. Aprobada.

PA-09 · HU09 Buscar y filtrar: Se comprobó la búsqueda por título y descripción, filtros por estado, prioridad y categoría, permisos según el rol y resultados vacíos cuando no existen coincidencias. Aprobada.

PA-10 · HU10 Indicadores: Se verificaron los indicadores por estado, tiempo de ciclo, filtros y eventos, sin rankings ni datos personales. Solo el coordinador tiene acceso. Aprobada.

PA-11 · HU11 Historial de auditoría: Se comprobó que sea de solo lectura, con actor codificado, fecha, cambios, filtros y paginación. Solo el auditor puede acceder. Aprobada.

PA-12 · HU12 Exportar CSV: Se verificó la generación del CSV, aplicación de filtros, ausencia de credenciales y datos personales, registro de la exportación y acceso exclusivo del coordinador. Aprobada.

Cambios controlados

CAM-01 · Prioridad Alta: La prioridad Alta exige justificación y fecha objetivo válida. Al bajarla, estos datos se eliminan y la base de datos también impide valores inválidos. Aprobada.

CAM-02 · Auditor en solo lectura: Se comprobó que el auditor no pueda modificar solicitudes ni acceder a funciones que no le corresponden. El historial permanece inmutable. Aprobada.

Pruebas complementarias

Se aprobó la eliminación lógica de solicitudes, la regresión del flujo completo de HU01 a HU12 y las pruebas del frontend relacionadas con el login, formulario de nueva solicitud, rutas protegidas y tabla.

Verificación de instalación

Se clonó el repositorio en una carpeta limpia usando el tag Sprint-3-Cierre y se siguieron los pasos del README.md: npm ci, migraciones, datos semilla y pruebas.

La instalación terminó sin errores. La aplicación inicia sin solicitudes y con los 7 usuarios de prueba.