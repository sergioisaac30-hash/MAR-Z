-- Eliminar solicitud (borrado lógico, auditado).
-- SQLite no permite agregar una columna con FOREIGN KEY inline junto con otras
-- restricciones en ALTER TABLE ADD COLUMN más allá de una REFERENCES simple; se
-- usa esa forma, igual que hace Prisma para columnas nuevas opcionales.

-- AlterTable
ALTER TABLE "solicitudes" ADD COLUMN "eliminada_en" DATETIME;
ALTER TABLE "solicitudes" ADD COLUMN "eliminada_por" INTEGER REFERENCES "usuarios" ("id");

-- Nueva acción de auditoría para el borrado lógico.
INSERT INTO "acciones_auditoria" ("codigo", "descripcion") VALUES ('SOLICITUD_ELIMINADA', 'Eliminación de solicitud');
