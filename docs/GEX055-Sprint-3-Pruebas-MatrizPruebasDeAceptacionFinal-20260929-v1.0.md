# Matriz de pruebas de aceptación final · PA-01 a PA-12

Proyecto: Mesa de Solicitudes · Sprint 3 (cierre del proyecto)
Fecha de ejecución: 2026-09-29
Versión probada: tag `Sprint-3-Cierre`
Comando: `npm test` (instalación limpia con `npm ci`)

## Resumen

| Conjunto | Archivos | Pruebas | Resultado |
|----------|----------|---------|-----------|
| Backend (API) | 16 | 125 | 125 correctas |
| Frontend | 4 | 13 | 13 correctas |
| **Total** | **20** | **138** | **138 correctas, 0 fallidas** |

## Matriz

| PA | HU | Sprint | Criterios verificados | Archivo | Resultado |
|----|----|--------|-----------------------|---------|-----------|
| PA-01 | HU01 Inicio de sesión por roles | 1 | CA1 credenciales válidas y cookie httpOnly · CA2 respuesta única para contraseña incorrecta, usuario inexistente o inactivo · CA3 cierre de sesión, rutas protegidas, token manipulado · CA4 acceso por rol validado en la API · anti-CSRF y contraseñas con bcrypt | `pa01-login.test.js` | Aprobada |
| PA-02 | HU02 Crear solicitud | 1 | CA3 categoría válida · CA4–CA7 ID, fecha, estado "Nuevo" y propietario fijados por el sistema · prioridad por defecto Media · creación auditada | `pa02-crear-solicitud.test.js` | Aprobada |
| PA-03 | HU03 Mis solicitudes | 1 | CA1 solo solicitudes propias, también por URL (404) · CA2 detalle propio · CA3–CA4 estado y última actualización | `pa03-mis-solicitudes.test.js` | Aprobada |
| PA-04 | HU04 Priorizar | 1 | CA1 prioridad válida · CA2 cambio trazable · CA3 orden por prioridad, estado y fecha · CA4 solo el coordinador | `pa04-priorizar.test.js` | Aprobada |
| PA-05 | HU05 Asignar | 2 | CA1–CA2 solo agentes activos · CA1–CA4 asignación con registro · CA5 notificación en la aplicación · CA6 rechazos (inactivo, mismo agente, resuelta o cerrada) · reasignación con una sola asignación vigente | `pa05-asignar.test.js` | Aprobada |
| PA-06 | HU06 Comentarios | 2 | CA1 no vacío · CA2 autor y fecha del servidor · CA2/CA4 sin edición ni borrado · CA3 visibilidad restringida · auditado sin copiar el texto | `pa06-comentarios.test.js` | Aprobada |
| PA-07 | HU07 Cambiar estado | 2 | CA1 flujo válido Asignada → En progreso → En espera → En progreso → Resuelta · CA2 historial completo · CA3 transición inválida rechazada sin cambios; el agente no cierra ni reabre | `pa07-cambiar-estado.test.js` | Aprobada |
| PA-08 | HU08 Confirmar o reabrir | 2 | CA2 confirmar una solicitud "Resuelta" · CA3 reabrir con motivo obligatorio · CA4 trazabilidad · solo el solicitante propietario | `pa08-confirmar-reabrir.test.js` | Aprobada |
| PA-09 | HU09 Buscar y filtrar | 3 | CA1 texto en título y descripción · CA2 estado, prioridad y categoría · CA3 respeta permisos por rol · CA4 combinación consistente y lista vacía sin coincidencias | `pa09-buscar-filtrar.test.js` | Aprobada |
| PA-10 | HU10 Indicadores | 3 | CA1 volumen por estado (incluye ceros) · CA2 tiempo mediano de ciclo · CA3 filtros reproducibles · CA4 eventos por tipo · CA5 sin rankings ni datos de personas · solo el coordinador | `pa10-indicadores.test.js` | Aprobada |
| PA-11 | HU11 Historial de auditoría | 3 | CA1 solo lectura · CA2 actor codificado, fecha, campo, valor anterior y nuevo, sin nombre ni correo · filtros y paginación · CA3 solo el auditor | `pa11-auditoria.test.js` | Aprobada |
| PA-12 | HU12 Exportar CSV | 3 | CA1 CSV con cabecera fija · CA2 respeta los filtros · CA3 sin credenciales ni datos personales · CA4 sin texto libre · CA5 exportación registrada, también sin resultados · solo el coordinador | `pa12-exportar.test.js` | Aprobada |

## Cambios controlados

| Cambio | Sprint | Criterios verificados | Archivo | Resultado |
|--------|--------|-----------------------|---------|-----------|
| CAM-01 Prioridad Alta | 2 | Alta exige justificación y fecha objetivo (no pasada) al crear y al priorizar · bajar de Alta limpia ambos campos · la base de datos también lo impide | `cam01-prioridad-alta.test.js` | Aprobada |
| CAM-02 Auditor en solo lectura | 3 | El auditor no crea, prioriza, asigna, comenta, cambia estado, confirma ni reabre · no accede a solicitudes, indicadores ni exportaciones · el historial es inmutable también fuera de la API | `cam02-auditor-solo-lectura.test.js` | Aprobada |

## Pruebas complementarias

| Prueba | Archivo | Resultado |
|--------|---------|-----------|
| Eliminación lógica de solicitudes | `eliminar-solicitud.test.js` | Aprobada |
| Regresión: flujo completo HU01–HU12 | `regresion-flujo-completo.test.js` | Aprobada |
| Frontend: login, formulario de nueva solicitud, rutas protegidas y tabla | `src/frontend/src/test/*` | Aprobada |

## Verificación de instalación

Se clonó el repositorio en una carpeta limpia en el tag `Sprint-3-Cierre` y se siguieron los pasos del `README.md` (`npm ci`, migraciones, datos semilla y pruebas) sin errores. La aplicación arranca sin solicitudes y con los 7 usuarios de prueba.
