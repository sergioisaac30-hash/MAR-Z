# Reporte de pruebas · Sprint 2 (HU05–HU08 y CAM-01)

Fecha de ejecución: 2026-09-29
Versión probada: tag `Sprint-2-Cierre`
Comando: `npm test` (instalación limpia con `npm ci`)

## Resumen

| Conjunto | Archivos | Pruebas | Resultado |
|----------|----------|---------|-----------|
| Backend (API) | 10 | 85 | 85 correctas |
| Frontend | 4 | 13 | 13 correctas |
| **Total** | **14** | **98** | **98 correctas, 0 fallidas** |

Incluye las pruebas del Sprint 1 (HU01–HU04), que se vuelven a ejecutar como regresión.

## HU05 · Asignar solicitud (`pa05-asignar.test.js`)

- CA1–CA2: la lista de agentes solo incluye agentes con estado Activo.
- CA1–CA4: asigna a un agente activo y registra quién y cuándo.
- CA5: el agente recibe una notificación dentro de la aplicación; nadie puede leer notificaciones ajenas.
- CA6: rechaza asignar a un agente inactivo, a otro rol o a un usuario inexistente, reasignar al mismo agente y asignar solicitudes resueltas o cerradas.
- Solo el coordinador asigna. Al reasignar, el agente anterior pierde el acceso y queda una sola asignación vigente.
- El agente solo lista las solicitudes que tiene asignadas.

## HU06 · Comentarios de trabajo (`pa06-comentarios.test.js`)

- CA1: el comentario no puede estar vacío.
- CA2: autor y fecha los fija el servidor.
- CA2/CA4: no se puede editar ni borrar un comentario.
- CA3: visible para el solicitante propietario, el agente asignado y el coordinador; no visible para otros.
- Solo el agente asignado comenta; el comentario queda en auditoría sin copiar su texto.

## HU07 · Cambiar estado (`pa07-cambiar-estado.test.js`)

- Las transiciones disponibles dependen del estado y del rol.
- CA1: flujo válido Asignada → En progreso → En espera → En progreso → Resuelta.
- CA2: historial completo con actor codificado, fecha, campo y valores.
- CA3: una transición inválida se rechaza sin modificar nada; el agente no puede cerrar ni reabrir.

## HU08 · Confirmar o reabrir (`pa08-confirmar-reabrir.test.js`)

- CA2: el solicitante confirma una solicitud "Resuelta"; no se puede confirmar ni reabrir en otro estado.
- CA3: puede reabrirla con un motivo obligatorio.
- CA4: confirmación y reapertura quedan trazadas y no pueden modificarse.
- Solo el solicitante propietario confirma o reabre.

## CAM-01 · Prioridad Alta (`cam01-prioridad-alta.test.js`)

- Al crear: rechaza Alta sin justificación o con fecha objetivo vacía, pasada o inválida; acepta Alta con ambos datos y lo deja trazado.
- Al priorizar: el coordinador no puede subir a Alta sin justificación y fecha objetivo; bajar de Alta limpia ambos campos.
- La base de datos también impide una Alta sin justificación.

## Verificación de instalación

Se clonó el repositorio en una carpeta limpia en el tag `Sprint-2-Cierre` y se siguieron los pasos del `README.md` (`npm ci`, `npm run db:migrate`, `npm run db:seed` y `npm test`) sin errores. La base queda con los 7 usuarios de prueba y sin solicitudes.
