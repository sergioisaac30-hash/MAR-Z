-- Mesa de Solicitudes - Sprint 1 (HU01-HU04)
-- Script de base de datos (SQLite): estructura, catalogos y usuarios de prueba (sin solicitudes).
-- Equivale a ejecutar las migraciones de src/backend/prisma/migrations y el seed (src/backend/prisma/seed.js).
-- Todos los datos son ficticios. Contrasena de todas las cuentas de prueba: Mesa2026!
-- Uso: sqlite3 mesa.db < este_archivo.sql
BEGIN TRANSACTION;
CREATE TABLE "acciones_auditoria" (
    "codigo" TEXT NOT NULL PRIMARY KEY,
    "descripcion" TEXT NOT NULL
);
INSERT INTO "acciones_auditoria" VALUES('SOLICITUD_CREADA','Creación de solicitud');
INSERT INTO "acciones_auditoria" VALUES('PRIORIDAD_CAMBIADA','Cambio de prioridad');
INSERT INTO "acciones_auditoria" VALUES('SOLICITUD_ELIMINADA','Eliminación de solicitud');
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
CREATE TABLE "categorias" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "categorias" VALUES(1,'Equipos de cómputo',1);
INSERT INTO "categorias" VALUES(2,'Red y conectividad',1);
INSERT INTO "categorias" VALUES(3,'Aplicaciones de operación',1);
INSERT INTO "categorias" VALUES(4,'Accesos y permisos',1);
INSERT INTO "categorias" VALUES(5,'Impresión y etiquetado',1);
INSERT INTO "categorias" VALUES(6,'Infraestructura del sitio',1);
CREATE TABLE "estados" (
    "codigo" TEXT NOT NULL PRIMARY KEY,
    "orden" INTEGER NOT NULL,
    "es_final" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "estados" VALUES('Nuevo',1,0);
INSERT INTO "estados" VALUES('Asignada',2,0);
INSERT INTO "estados" VALUES('En progreso',3,0);
INSERT INTO "estados" VALUES('En espera',4,0);
INSERT INTO "estados" VALUES('Resuelta',5,0);
INSERT INTO "estados" VALUES('Reabierta',6,0);
INSERT INTO "estados" VALUES('Cerrada',7,1);
CREATE TABLE "prioridades" (
    "codigo" TEXT NOT NULL PRIMARY KEY,
    "orden" INTEGER NOT NULL
);
INSERT INTO "prioridades" VALUES('Baja',1);
INSERT INTO "prioridades" VALUES('Media',2);
INSERT INTO "prioridades" VALUES('Alta',3);
CREATE TABLE "roles" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL
);
INSERT INTO "roles" VALUES(1,'SOLICITANTE','Solicitante');
INSERT INTO "roles" VALUES(2,'AGENTE','Agente');
INSERT INTO "roles" VALUES(3,'COORDINADOR','Coordinador');
INSERT INTO "roles" VALUES(4,'AUDITOR','Auditor');
CREATE TABLE "sesiones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuario_id" INTEGER NOT NULL,
    "creada_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expira_en" DATETIME NOT NULL,
    "revocada_en" DATETIME,
    CONSTRAINT "sesiones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
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
    "cerrada_en" DATETIME, "eliminada_en" DATETIME, "eliminada_por" INTEGER REFERENCES "usuarios" ("id"),
    CONSTRAINT "solicitudes_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "solicitudes_prioridad_fkey" FOREIGN KEY ("prioridad") REFERENCES "prioridades" ("codigo") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "solicitudes_estado_fkey" FOREIGN KEY ("estado") REFERENCES "estados" ("codigo") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "solicitudes_solicitante_id_fkey" FOREIGN KEY ("solicitante_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
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
INSERT INTO "usuarios" VALUES(1,'ACT-S7N2','Solicitante Sitio Norte','solicitante.norte@mesa.test','$2a$12$aZ3QyoXG5eafEKfu.XfLZeBKMQOJPOkVQQIO5TzWmJt765ezUnhja',1,'Activo',1790704327693,1790704327693);
INSERT INTO "usuarios" VALUES(2,'ACT-S4R8','Solicitante Sitio Sur','solicitante.sur@mesa.test','$2a$12$aZ3QyoXG5eafEKfu.XfLZeBKMQOJPOkVQQIO5TzWmJt765ezUnhja',1,'Activo',1790704327704,1790704327704);
INSERT INTO "usuarios" VALUES(3,'ACT-A1K5','Agente Soporte Uno','agente.uno@mesa.test','$2a$12$aZ3QyoXG5eafEKfu.XfLZeBKMQOJPOkVQQIO5TzWmJt765ezUnhja',2,'Activo',1790704327714,1790704327714);
INSERT INTO "usuarios" VALUES(4,'ACT-A9P3','Agente Soporte Dos','agente.dos@mesa.test','$2a$12$aZ3QyoXG5eafEKfu.XfLZeBKMQOJPOkVQQIO5TzWmJt765ezUnhja',2,'Activo',1790704327722,1790704327722);
INSERT INTO "usuarios" VALUES(5,'ACT-A6X0','Agente Soporte Tres','agente.tres@mesa.test','$2a$12$aZ3QyoXG5eafEKfu.XfLZeBKMQOJPOkVQQIO5TzWmJt765ezUnhja',2,'Inactivo',1790704327730,1790704327755);
INSERT INTO "usuarios" VALUES(6,'ACT-C2M7','Coordinación Central','coordinador@mesa.test','$2a$12$aZ3QyoXG5eafEKfu.XfLZeBKMQOJPOkVQQIO5TzWmJt765ezUnhja',3,'Activo',1790704327738,1790704327738);
INSERT INTO "usuarios" VALUES(7,'ACT-D5Q1','Auditoría Interna','auditor@mesa.test','$2a$12$aZ3QyoXG5eafEKfu.XfLZeBKMQOJPOkVQQIO5TzWmJt765ezUnhja',4,'Activo',1790704327745,1790704327745);
CREATE UNIQUE INDEX "roles_codigo_key" ON "roles"("codigo");
CREATE UNIQUE INDEX "usuarios_codigo_actor_key" ON "usuarios"("codigo_actor");
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");
CREATE INDEX "usuarios_rol_id_estado_idx" ON "usuarios"("rol_id", "estado");
CREATE INDEX "sesiones_usuario_id_idx" ON "sesiones"("usuario_id");
CREATE UNIQUE INDEX "categorias_nombre_key" ON "categorias"("nombre");
CREATE UNIQUE INDEX "prioridades_orden_key" ON "prioridades"("orden");
CREATE UNIQUE INDEX "estados_orden_key" ON "estados"("orden");
CREATE INDEX "solicitudes_solicitante_id_idx" ON "solicitudes"("solicitante_id");
CREATE INDEX "solicitudes_estado_idx" ON "solicitudes"("estado");
CREATE INDEX "solicitudes_prioridad_idx" ON "solicitudes"("prioridad");
CREATE INDEX "solicitudes_categoria_id_idx" ON "solicitudes"("categoria_id");
CREATE INDEX "solicitudes_creada_en_idx" ON "solicitudes"("creada_en");
CREATE INDEX "auditoria_solicitud_id_creado_en_idx" ON "auditoria"("solicitud_id", "creado_en");
CREATE INDEX "auditoria_accion_idx" ON "auditoria"("accion");
CREATE INDEX "auditoria_creado_en_idx" ON "auditoria"("creado_en");
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
CREATE TRIGGER "trg_solicitudes_obligatorios" BEFORE INSERT ON "solicitudes"
WHEN length(trim(NEW."titulo")) = 0 OR length(trim(NEW."descripcion")) = 0
BEGIN SELECT RAISE(ABORT, 'CAMPOS_OBLIGATORIOS'); END;
CREATE TRIGGER "trg_auditoria_sin_update" BEFORE UPDATE ON "auditoria"
BEGIN SELECT RAISE(ABORT, 'AUDITORIA_INMUTABLE'); END;
CREATE TRIGGER "trg_auditoria_sin_delete" BEFORE DELETE ON "auditoria"
BEGIN SELECT RAISE(ABORT, 'AUDITORIA_INMUTABLE'); END;
DELETE FROM "sqlite_sequence";
INSERT INTO "sqlite_sequence" VALUES('roles',4);
INSERT INTO "sqlite_sequence" VALUES('categorias',6);
INSERT INTO "sqlite_sequence" VALUES('usuarios',7);
COMMIT;
