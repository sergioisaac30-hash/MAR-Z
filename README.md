Mesa de Solicitudes
Aplicación web para registrar y gestionar solicitudes de soporte. Los solicitantes crean solicitudes, los coordinadores las organizan y asignan, los agentes las atienden y los auditores pueden revisar el historial. La aplicación inicia sin solicitudes. Cada cuenta empieza vacía hasta que un solicitante cree una.

Historias de usuario
•	Sprint 1: Inicio de sesión, crear solicitudes, consultar solicitudes y organizarlas.
•	Sprint 2: Asignar solicitudes, agregar comentarios, cambiar estados y confirmar o reabrir soluciones.
•	Sprint 3: Buscar y filtrar, ver indicadores, revisar auditoría y exportar reportes.
También se agregaron algunas reglas para las solicitudes de prioridad alta y para el acceso del auditor.


Tecnologías
•	Node.js y Express
•	React y Vite
•	Prisma
•	SQLite
•	Vitest y Supertest

Requisitos
•	Node.js 20 o superior
•	npm
•	Git

Estructura
src/backend: API, base de datos y pruebas
src/frontend: interfaz web
database: scripts SQL de cada sprint
docs: reporte de pruebas

Instalación 
1 Clonar el repositorio: git clone https://github.com/sergioisaac30-hash/MAR-Z.git
   cd MAR-Z
2 Instalar las dependencias: npm install
3 Crear la base de datos y los usuarios de prueba:
   npm run db:migrate
   npm run db:seed
Para iniciar el proyecto: npm run dev
Luego entrar a: http://localhost:5173
La API funciona en:http://localhost:4000/api

Para ver cómo quedó el proyecto al final de cada sprint se puede usar la etiqueta correspondiente, por ejemplo: `git checkout Sprint-1-Cierre`.

Usuarios de prueba
La contraseña de todas las cuentas es: Mesa2026!
•	Solicitante: solicitante.norte@mesa.test
•	Solicitante: solicitante.sur@mesa.test
•	Coordinador: coordinador@mesa.test
•	Agente: agente.uno@mesa.test
•	Agente: agente.dos@mesa.test
•	Auditor: auditor@mesa.test


Estados de las solicitudes
Una solicitud puede pasar por los siguientes estados:
Nuevo - Asignada - En progreso - Resuelta - Cerrada
También puede quedar En espera o ser Reabierta dependiendo del caso.

Pruebas
Para ejecutar las pruebas: npm test
Las pruebas revisan el inicio de sesión, solicitudes, asignaciones, comentarios, estados, búsquedas, auditoría y exportación de reportes.

Si hay problemas
Si aparece un error relacionado con la base de datos, se puede reiniciar con: npm run db:reset
Si se cambió de versión del proyecto y hay problemas con Prisma: npx prisma generate

