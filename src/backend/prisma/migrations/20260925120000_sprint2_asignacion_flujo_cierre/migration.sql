-- Sprint 2 (CAM-01 + HU05-HU08): flujo de asignación, comentarios, cambios de
-- estado y cierre de solicitudes.

-- AlterTable
ALTER TABLE "solicitudes" ADD COLUMN "justificacion_prioridad" TEXT;
ALTER TABLE "solicitudes" ADD COLUMN "fecha_objetivo" DATETIME;

-- CreateTable
CREATE TABLE "transiciones_estado" (
    "estado_origen" TEXT NOT NULL,
    "estado_destino" TEXT NOT NULL,
    "rol_id" INTEGER NOT NULL,

    PRIMARY KEY ("estado_origen", "estado_destino", "rol_id"),
    CONSTRAINT "transiciones_estado_estado_origen_fkey" FOREIGN KEY ("estado_origen") REFERENCES "estados" ("codigo") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "transiciones_estado_estado_destino_fkey" FOREIGN KEY ("estado_destino") REFERENCES "estados" ("codigo") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "transiciones_estado_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "asignaciones" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "solicitud_id" INTEGER NOT NULL,
    "agente_id" INTEGER NOT NULL,
    "asignado_por" INTEGER NOT NULL,
    "asignado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vigente" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "asignaciones_solicitud_id_fkey" FOREIGN KEY ("solicitud_id") REFERENCES "solicitudes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "asignaciones_agente_id_fkey" FOREIGN KEY ("agente_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "asignaciones_asignado_por_fkey" FOREIGN KEY ("asignado_por") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "comentarios" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "solicitud_id" INTEGER NOT NULL,
    "autor_id" INTEGER NOT NULL,
    "contenido" TEXT NOT NULL,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "comentarios_solicitud_id_fkey" FOREIGN KEY ("solicitud_id") REFERENCES "solicitudes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "comentarios_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cierres" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "solicitud_id" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "motivo" TEXT,
    "actor_id" INTEGER NOT NULL,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cierres_solicitud_id_fkey" FOREIGN KEY ("solicitud_id") REFERENCES "solicitudes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "cierres_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuario_id" INTEGER NOT NULL,
    "solicitud_id" INTEGER,
    "tipo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "creada_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leida_en" DATETIME,
    CONSTRAINT "notificaciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "notificaciones_solicitud_id_fkey" FOREIGN KEY ("solicitud_id") REFERENCES "solicitudes" ("id") ON DELETE SET NULL ON UPDATE NO ACTION
);

-- CreateIndex
CREATE INDEX "asignaciones_solicitud_id_vigente_idx" ON "asignaciones"("solicitud_id", "vigente");

-- CreateIndex
CREATE INDEX "asignaciones_agente_id_vigente_idx" ON "asignaciones"("agente_id", "vigente");

-- CreateIndex
CREATE INDEX "comentarios_solicitud_id_creado_en_idx" ON "comentarios"("solicitud_id", "creado_en");

-- CreateIndex
CREATE INDEX "cierres_solicitud_id_idx" ON "cierres"("solicitud_id");

-- CreateIndex
CREATE INDEX "notificaciones_usuario_id_leida_en_idx" ON "notificaciones"("usuario_id", "leida_en");

-- ─── Reglas de integridad adicionales (añadidas manualmente) ──────────────────
-- Prisma no modela CHECK ni triggers; se declaran aquí, igual que en la migración
-- anterior, para reforzar en la base de datos lo que también valida la API.

-- Cambio 1 (CAM-01): una prioridad Alta exige justificación y fecha objetivo.
-- Se valida al crear la solicitud y cuando cambian prioridad, justificación o fecha
-- objetivo; las filas existentes antes del cambio no se reescriben.
CREATE TRIGGER "trg_solicitudes_alta_insert" BEFORE INSERT ON "solicitudes"
WHEN NEW."prioridad" = 'Alta'
  AND (NEW."justificacion_prioridad" IS NULL OR length(trim(NEW."justificacion_prioridad")) = 0 OR NEW."fecha_objetivo" IS NULL)
BEGIN SELECT RAISE(ABORT, 'JUSTIFICACION_ALTA_REQUERIDA'); END;

CREATE TRIGGER "trg_solicitudes_alta_update"
BEFORE UPDATE OF "prioridad", "justificacion_prioridad", "fecha_objetivo" ON "solicitudes"
WHEN NEW."prioridad" = 'Alta'
  AND (NEW."justificacion_prioridad" IS NULL OR length(trim(NEW."justificacion_prioridad")) = 0 OR NEW."fecha_objetivo" IS NULL)
BEGIN SELECT RAISE(ABORT, 'JUSTIFICACION_ALTA_REQUERIDA'); END;

-- HU05: solo se asigna a usuarios con rol AGENTE y estado Activo.
CREATE TRIGGER "trg_asignaciones_agente_activo" BEFORE INSERT ON "asignaciones"
WHEN NOT EXISTS (
  SELECT 1 FROM "usuarios" u JOIN "roles" r ON r."id" = u."rol_id"
  WHERE u."id" = NEW."agente_id" AND r."codigo" = 'AGENTE' AND u."estado" = 'Activo'
)
BEGIN SELECT RAISE(ABORT, 'AGENTE_NO_ACTIVO'); END;

-- HU05: como máximo una asignación vigente por solicitud.
CREATE TRIGGER "trg_asignaciones_una_vigente" BEFORE INSERT ON "asignaciones"
WHEN NEW."vigente" = 1
  AND EXISTS (SELECT 1 FROM "asignaciones" WHERE "solicitud_id" = NEW."solicitud_id" AND "vigente" = 1)
BEGIN SELECT RAISE(ABORT, 'ASIGNACION_VIGENTE_DUPLICADA'); END;

-- HU05: una asignación solo puede pasar de vigente a histórica; el resto es inmutable.
CREATE TRIGGER "trg_asignaciones_sin_update" BEFORE UPDATE ON "asignaciones"
WHEN NOT (OLD."vigente" = 1 AND NEW."vigente" = 0
  AND NEW."solicitud_id" = OLD."solicitud_id" AND NEW."agente_id" = OLD."agente_id"
  AND NEW."asignado_por" = OLD."asignado_por" AND NEW."asignado_en" = OLD."asignado_en")
BEGIN SELECT RAISE(ABORT, 'ASIGNACION_INMUTABLE'); END;

CREATE TRIGGER "trg_asignaciones_sin_delete" BEFORE DELETE ON "asignaciones"
BEGIN SELECT RAISE(ABORT, 'ASIGNACION_INMUTABLE'); END;

-- HU06: comentario no vacío e inmutable (autor, fecha y contenido).
CREATE TRIGGER "trg_comentarios_no_vacio" BEFORE INSERT ON "comentarios"
WHEN length(trim(NEW."contenido")) = 0
BEGIN SELECT RAISE(ABORT, 'COMENTARIO_VACIO'); END;

CREATE TRIGGER "trg_comentarios_sin_update" BEFORE UPDATE ON "comentarios"
BEGIN SELECT RAISE(ABORT, 'COMENTARIO_INMUTABLE'); END;

CREATE TRIGGER "trg_comentarios_sin_delete" BEFORE DELETE ON "comentarios"
BEGIN SELECT RAISE(ABORT, 'COMENTARIO_INMUTABLE'); END;

-- HU08: tipo válido y motivo obligatorio para reabrir; registros inmutables.
CREATE TRIGGER "trg_cierres_validos" BEFORE INSERT ON "cierres"
WHEN NEW."tipo" NOT IN ('CONFIRMACION', 'REAPERTURA')
  OR (NEW."tipo" = 'REAPERTURA' AND (NEW."motivo" IS NULL OR length(trim(NEW."motivo")) = 0))
BEGIN SELECT RAISE(ABORT, 'CIERRE_INVALIDO'); END;

CREATE TRIGGER "trg_cierres_sin_update" BEFORE UPDATE ON "cierres"
BEGIN SELECT RAISE(ABORT, 'CIERRE_INMUTABLE'); END;

CREATE TRIGGER "trg_cierres_sin_delete" BEFORE DELETE ON "cierres"
BEGIN SELECT RAISE(ABORT, 'CIERRE_INMUTABLE'); END;

-- ─── Catálogos del Sprint 2 ───────────────────────────────────────────────────

-- Flujo de estados (sección 6 de la especificación). rol_id: 1 SOLICITANTE, 2 AGENTE, 3 COORDINADOR.
INSERT INTO "transiciones_estado" ("estado_origen", "estado_destino", "rol_id") VALUES
  ('Nuevo', 'Asignada', 3),          -- al asignar (HU05)
  ('Asignada', 'En progreso', 2),    -- el agente inicia la atención (HU07)
  ('En progreso', 'En espera', 2),
  ('En espera', 'En progreso', 2),
  ('En progreso', 'Resuelta', 2),
  ('Reabierta', 'En progreso', 2),
  ('Resuelta', 'Cerrada', 1),        -- el solicitante confirma (HU08)
  ('Resuelta', 'Reabierta', 1);      -- el solicitante reabre con motivo (HU08)

INSERT INTO "acciones_auditoria" ("codigo", "descripcion") VALUES
  ('ASIGNACION', 'Asignación de agente'),
  ('ESTADO_CAMBIADO', 'Cambio de estado'),
  ('COMENTARIO_REGISTRADO', 'Registro de comentario de trabajo'),
  ('CONFIRMACION', 'Confirmación de la solución'),
  ('REAPERTURA', 'Reapertura con motivo');
