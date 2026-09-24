-- CreateTable
CREATE TABLE "roles" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo_actor" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "rol_id" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'Activo',
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" DATETIME NOT NULL,
    CONSTRAINT "usuarios_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sesiones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuario_id" INTEGER NOT NULL,
    "creada_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expira_en" DATETIME NOT NULL,
    "revocada_en" DATETIME,
    CONSTRAINT "sesiones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "prioridades" (
    "codigo" TEXT NOT NULL PRIMARY KEY,
    "orden" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "estados" (
    "codigo" TEXT NOT NULL PRIMARY KEY,
    "orden" INTEGER NOT NULL,
    "es_final" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "solicitudes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "categoria_id" INTEGER NOT NULL,
    "prioridad" TEXT NOT NULL DEFAULT 'Media',
    "estado" TEXT NOT NULL DEFAULT 'Nuevo',
    "solicitante_id" INTEGER NOT NULL,
    "creada_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizada_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cerrada_en" DATETIME,
    CONSTRAINT "solicitudes_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "solicitudes_prioridad_fkey" FOREIGN KEY ("prioridad") REFERENCES "prioridades" ("codigo") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "solicitudes_estado_fkey" FOREIGN KEY ("estado") REFERENCES "estados" ("codigo") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "solicitudes_solicitante_id_fkey" FOREIGN KEY ("solicitante_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "acciones_auditoria" (
    "codigo" TEXT NOT NULL PRIMARY KEY,
    "descripcion" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "auditoria" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "solicitud_id" INTEGER,
    "actor_id" INTEGER NOT NULL,
    "accion" TEXT NOT NULL,
    "campo" TEXT NOT NULL,
    "valor_anterior" TEXT,
    "valor_nuevo" TEXT,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "auditoria_solicitud_id_fkey" FOREIGN KEY ("solicitud_id") REFERENCES "solicitudes" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "auditoria_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "auditoria_accion_fkey" FOREIGN KEY ("accion") REFERENCES "acciones_auditoria" ("codigo") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_codigo_key" ON "roles"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_codigo_actor_key" ON "usuarios"("codigo_actor");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_rol_id_estado_idx" ON "usuarios"("rol_id", "estado");

-- CreateIndex
CREATE INDEX "sesiones_usuario_id_idx" ON "sesiones"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nombre_key" ON "categorias"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "prioridades_orden_key" ON "prioridades"("orden");

-- CreateIndex
CREATE UNIQUE INDEX "estados_orden_key" ON "estados"("orden");

-- CreateIndex
CREATE INDEX "solicitudes_solicitante_id_idx" ON "solicitudes"("solicitante_id");

-- CreateIndex
CREATE INDEX "solicitudes_estado_idx" ON "solicitudes"("estado");

-- CreateIndex
CREATE INDEX "solicitudes_prioridad_idx" ON "solicitudes"("prioridad");

-- CreateIndex
CREATE INDEX "solicitudes_categoria_id_idx" ON "solicitudes"("categoria_id");

-- CreateIndex
CREATE INDEX "solicitudes_creada_en_idx" ON "solicitudes"("creada_en");

-- CreateIndex
CREATE INDEX "auditoria_solicitud_id_creado_en_idx" ON "auditoria"("solicitud_id", "creado_en");

-- CreateIndex
CREATE INDEX "auditoria_accion_idx" ON "auditoria"("accion");

-- CreateIndex
CREATE INDEX "auditoria_creado_en_idx" ON "auditoria"("creado_en");

-- ─── Reglas de integridad adicionales (añadidas manualmente) ──────────────────
-- Prisma no modela CHECK ni triggers; se declaran aquí para reforzar en la base de
-- datos las reglas que también valida la API.

-- Contraseñas: solo se aceptan hashes bcrypt, nunca texto plano.
CREATE TRIGGER "trg_usuarios_hash_insert" BEFORE INSERT ON "usuarios"
WHEN NEW."password_hash" NOT GLOB '$2[aby]$*' OR length(NEW."password_hash") <> 60
BEGIN SELECT RAISE(ABORT, 'PASSWORD_HASH_INVALIDO'); END;

CREATE TRIGGER "trg_usuarios_hash_update" BEFORE UPDATE OF "password_hash" ON "usuarios"
WHEN NEW."password_hash" NOT GLOB '$2[aby]$*' OR length(NEW."password_hash") <> 60
BEGIN SELECT RAISE(ABORT, 'PASSWORD_HASH_INVALIDO'); END;

CREATE TRIGGER "trg_usuarios_estado_insert" BEFORE INSERT ON "usuarios"
WHEN NEW."estado" NOT IN ('Activo', 'Inactivo')
BEGIN SELECT RAISE(ABORT, 'ESTADO_USUARIO_INVALIDO'); END;

CREATE TRIGGER "trg_usuarios_estado_update" BEFORE UPDATE OF "estado" ON "usuarios"
WHEN NEW."estado" NOT IN ('Activo', 'Inactivo')
BEGIN SELECT RAISE(ABORT, 'ESTADO_USUARIO_INVALIDO'); END;

-- Campos obligatorios de la solicitud (HU02).
CREATE TRIGGER "trg_solicitudes_obligatorios" BEFORE INSERT ON "solicitudes"
WHEN length(trim(NEW."titulo")) = 0 OR length(trim(NEW."descripcion")) = 0
BEGIN SELECT RAISE(ABORT, 'CAMPOS_OBLIGATORIOS'); END;

-- Historial de auditoría inmutable.
CREATE TRIGGER "trg_auditoria_sin_update" BEFORE UPDATE ON "auditoria"
BEGIN SELECT RAISE(ABORT, 'AUDITORIA_INMUTABLE'); END;

CREATE TRIGGER "trg_auditoria_sin_delete" BEFORE DELETE ON "auditoria"
BEGIN SELECT RAISE(ABORT, 'AUDITORIA_INMUTABLE'); END;

-- ─── Catálogos del sistema ────────────────────────────────────────────────────
INSERT INTO "roles" ("id", "codigo", "nombre") VALUES
  (1, 'SOLICITANTE', 'Solicitante'),
  (2, 'AGENTE', 'Agente'),
  (3, 'COORDINADOR', 'Coordinador'),
  (4, 'AUDITOR', 'Auditor');

INSERT INTO "prioridades" ("codigo", "orden") VALUES
  ('Baja', 1),
  ('Media', 2),
  ('Alta', 3);

INSERT INTO "estados" ("codigo", "orden", "es_final") VALUES
  ('Nuevo', 1, false),
  ('Asignada', 2, false),
  ('En progreso', 3, false),
  ('En espera', 4, false),
  ('Resuelta', 5, false),
  ('Reabierta', 6, false),
  ('Cerrada', 7, true);

INSERT INTO "categorias" ("nombre", "activa") VALUES
  ('Equipos de cómputo', true),
  ('Red y conectividad', true),
  ('Aplicaciones de operación', true),
  ('Accesos y permisos', true),
  ('Impresión y etiquetado', true),
  ('Infraestructura del sitio', true);

INSERT INTO "acciones_auditoria" ("codigo", "descripcion") VALUES
  ('SOLICITUD_CREADA', 'Creación de solicitud'),
  ('PRIORIDAD_CAMBIADA', 'Cambio de prioridad');
