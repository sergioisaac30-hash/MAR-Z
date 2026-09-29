Reporte de pruebas · Sprint 2 (HU05–HU08 y CAM-01)

Fecha de ejecución: 2026-09-27
Versión probada: Sprint-2-Cierre
Comando: npm test con instalación limpia usando npm ci

Se realizaron 98 pruebas, de las cuales 98 fueron correctas y 0 fallaron.

En el backend se realizaron 85 pruebas y en el frontend 13. También se incluyen nuevamente las pruebas del Sprint 1 (HU01–HU04) como parte de la regresión.

HU05 · Asignar solicitud

Se comprobó que la lista de agentes solo muestre usuarios activos y que el coordinador pueda asignar solicitudes, dejando registrado quién realizó la asignación y cuándo.

El agente recibe una notificación dentro de la aplicación y no puede acceder a notificaciones de otros usuarios.

También se verificó que no sea posible asignar solicitudes a usuarios inactivos, de otro rol o inexistentes, ni reasignar al mismo agente o solicitudes resueltas o cerradas.

Al reasignar, el agente anterior pierde el acceso y queda una sola asignación vigente. Además, cada agente solo puede ver las solicitudes que tiene asignadas.

HU06 · Comentarios de trabajo

Se comprobó que los comentarios no puedan estar vacíos y que el servidor establezca automáticamente el autor y la fecha.

Los comentarios no pueden editarse ni eliminarse. Solo son visibles para el solicitante propietario, el agente asignado y el coordinador.

Únicamente el agente asignado puede comentar y cada comentario queda registrado en auditoría sin guardar su texto dentro de esta.

HU07 · Cambiar estado

Se verificó que las opciones de cambio de estado dependan del estado actual y del rol del usuario.

El flujo válido probado fue Asignada → En progreso → En espera → En progreso → Resuelta.

Los cambios quedan registrados con el actor, la fecha, el campo modificado y los valores anteriores y nuevos.

Las transiciones inválidas son rechazadas sin modificar la solicitud y el agente no puede cerrar ni reabrir una solicitud.

HU08 · Confirmar o reabrir

Se comprobó que el solicitante pueda confirmar una solicitud cuando está en estado Resuelta y que no pueda hacerlo en otro estado.

También puede reabrirla indicando un motivo obligatorio.

La confirmación y la reapertura quedan registradas y no pueden modificarse. Estas acciones solo las puede realizar el solicitante propietario.

CAM-01 · Prioridad Alta

Al crear una solicitud, se rechaza la prioridad Alta cuando falta la justificación o la fecha objetivo, o cuando esta última es inválida o está vencida.

Cuando se proporcionan ambos datos, la prioridad Alta se acepta y queda registrada.

Al cambiar la prioridad, el coordinador debe indicar justificación y fecha objetivo para subir a Alta. Al bajarla de Alta, estos datos se eliminan.

También se comprobó que la base de datos impida guardar una solicitud con prioridad Alta sin justificación.

Verificación de instalación

Se clonó el repositorio en una carpeta limpia usando el tag Sprint-2-Cierre y se siguieron los pasos del README.md: npm ci, npm run db:migrate, npm run db:seed y npm test.

La instalación terminó sin errores y la base de datos quedó con los 7 usuarios de prueba y sin solicitudes.