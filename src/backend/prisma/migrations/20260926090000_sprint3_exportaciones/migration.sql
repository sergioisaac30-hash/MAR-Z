-- CreateTable
CREATE TABLE "exportaciones" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuario_id" INTEGER NOT NULL,
    "filtros" TEXT NOT NULL,
    "filas" INTEGER NOT NULL,
    "creada_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "exportaciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "exportaciones_creada_en_idx" ON "exportaciones"("creada_en");

-- ─── Reglas de integridad adicionales (añadidas manualmente) ──────────────────

-- HU12: el registro de exportaciones es inmutable.
CREATE TRIGGER "trg_exportaciones_sin_update" BEFORE UPDATE ON "exportaciones"
BEGIN SELECT RAISE(ABORT, 'EXPORTACION_INMUTABLE'); END;

CREATE TRIGGER "trg_exportaciones_sin_delete" BEFORE DELETE ON "exportaciones"
BEGIN SELECT RAISE(ABORT, 'EXPORTACION_INMUTABLE'); END;

-- ─── Catálogo del Sprint 3 ────────────────────────────────────────────────────
INSERT INTO "acciones_auditoria" ("codigo", "descripcion") VALUES
  ('EXPORTACION', 'Exportación de reporte');
