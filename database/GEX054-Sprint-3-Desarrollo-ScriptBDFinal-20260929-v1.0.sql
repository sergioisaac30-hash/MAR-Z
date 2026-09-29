-- Mesa de Solicitudes - Sprints 1 a 3 (HU01-HU12)
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
INSERT INTO "acciones_auditoria" VALUES('ASIGNACION','Asignación de agente');
INSERT INTO "acciones_auditoria" VALUES('ESTADO_CAMBIADO','Cambio de estado');
INSERT INTO "acciones_auditoria" VALUES('COMENTARIO_REGISTRADO','Registro de comentario de trabajo');
INSERT INTO "acciones_auditoria" VALUES('CONFIRMACION','Confirmación de la solución');
INSERT INTO "acciones_auditoria" VALUES('REAPERTURA','Reapertura con motivo');
INSERT INTO "acciones_auditoria" VALUES('EXPORTACION','Exportación de reporte');
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
CREATE TABLE "comentarios" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "solicitud_id" INTEGER NOT NULL,
    "autor_id" INTEGER NOT NULL,
    "contenido" TEXT NOT NULL,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "comentarios_solicitud_id_fkey" FOREIGN KEY ("solicitud_id") REFERENCES "solicitudes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "comentarios_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
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
CREATE TABLE "exportaciones" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuario_id" INTEGER NOT NULL,
    "filtros" TEXT NOT NULL,
    "filas" INTEGER NOT NULL,
    "creada_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "exportaciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
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
    "cerrada_en" DATETIME, "eliminada_en" DATETIME, "eliminada_por" INTEGER REFERENCES "usuarios" ("id"), "justificacion_prioridad" TEXT, "fecha_objetivo" DATETIME,
    CONSTRAINT "solicitudes_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "solicitudes_prioridad_fkey" FOREIGN KEY ("prioridad") REFERENCES "prioridades" ("codigo") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "solicitudes_estado_fkey" FOREIGN KEY ("estado") REFERENCES "estados" ("codigo") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "solicitudes_solicitante_id_fkey" FOREIGN KEY ("solicitante_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE "transiciones_estado" (
    "estado_origen" TEXT NOT NULL,
    "estado_destino" TEXT NOT NULL,
    "rol_id" INTEGER NOT NULL,

    PRIMARY KEY ("estado_origen", "estado_destino", "rol_id"),
    CONSTRAINT "transiciones_estado_estado_origen_fkey" FOREIGN KEY ("estado_origen") REFERENCES "estados" ("codigo") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "transiciones_estado_estado_destino_fkey" FOREIGN KEY ("estado_destino") REFERENCES "estados" ("codigo") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "transiciones_estado_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "transiciones_estado" VALUES('Nuevo','Asignada',3);
INSERT INTO "transiciones_estado" VALUES('Asignada','En progreso',2);
INSERT INTO "transiciones_estado" VALUES('En progreso','En espera',2);
INSERT INTO "transiciones_estado" VALUES('En espera','En progreso',2);
INSERT INTO "transiciones_estado" VALUES('En progreso','Resuelta',2);
INSERT INTO "transiciones_estado" VALUES('Reabierta','En progreso',2);
INSERT INTO "transiciones_estado" VALUES('Resuelta','Cerrada',1);
INSERT INTO "transiciones_estado" VALUES('Resuelta','Reabierta',1);
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
INSERT INTO "usuarios" VALUES(1,'ACT-S7N2','Solicitante Sitio Norte','solicitante.norte@mesa.test','$2a$12$3MITKTLPi1MeFW0mnBKoJuG8uVD/ICC6bBl.eEf65TR3Qv8g04eeq',1,'Activo',1790706728968,1790706728968);
INSERT INTO "usuarios" VALUES(2,'ACT-S4R8','Solicitante Sitio Sur','solicitante.sur@mesa.test','$2a$12$3MITKTLPi1MeFW0mnBKoJuG8uVD/ICC6bBl.eEf65TR3Qv8g04eeq',1,'Activo',1790706728983,1790706728983);
INSERT INTO "usuarios" VALUES(3,'ACT-A1K5','Agente Soporte Uno','agente.uno@mesa.test','$2a$12$3MITKTLPi1MeFW0mnBKoJuG8uVD/ICC6bBl.eEf65TR3Qv8g04eeq',2,'Activo',1790706728990,1790706728990);
INSERT INTO "usuarios" VALUES(4,'ACT-A9P3','Agente Soporte Dos','agente.dos@mesa.test','$2a$12$3MITKTLPi1MeFW0mnBKoJuG8uVD/ICC6bBl.eEf65TR3Qv8g04eeq',2,'Activo',1790706728996,1790706728996);
INSERT INTO "usuarios" VALUES(5,'ACT-A6X0','Agente Soporte Tres','agente.tres@mesa.test','$2a$12$3MITKTLPi1MeFW0mnBKoJuG8uVD/ICC6bBl.eEf65TR3Qv8g04eeq',2,'Inactivo',1790706729002,1790706729026);
INSERT INTO "usuarios" VALUES(6,'ACT-C2M7','Coordinación Central','coordinador@mesa.test','$2a$12$3MITKTLPi1MeFW0mnBKoJuG8uVD/ICC6bBl.eEf65TR3Qv8g04eeq',3,'Activo',1790706729010,1790706729010);
INSERT INTO "usuarios" VALUES(7,'ACT-D5Q1','Auditoría Interna','auditor@mesa.test','$2a$12$3MITKTLPi1MeFW0mnBKoJuG8uVD/ICC6bBl.eEf65TR3Qv8g04eeq',4,'Activo',1790706729016,1790706729016);
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
CREATE INDEX "asignaciones_solicitud_id_vigente_idx" ON "asignaciones"("solicitud_id", "vigente");
CREATE INDEX "asignaciones_agente_id_vigente_idx" ON "asignaciones"("agente_id", "vigente");
CREATE INDEX "comentarios_solicitud_id_creado_en_idx" ON "comentarios"("solicitud_id", "creado_en");
CREATE INDEX "cierres_solicitud_id_idx" ON "cierres"("solicitud_id");
CREATE INDEX "notificaciones_usuario_id_leida_en_idx" ON "notificaciones"("usuario_id", "leida_en");
CREATE TRIGGER "trg_solicitudes_alta_insert" BEFORE INSERT ON "solicitudes"
WHEN NEW."prioridad" = 'Alta'
  AND (NEW."justificacion_prioridad" IS NULL OR length(trim(NEW."justificacion_prioridad")) = 0 OR NEW."fecha_objetivo" IS NULL)
BEGIN SELECT RAISE(ABORT, 'JUSTIFICACION_ALTA_REQUERIDA'); END;
CREATE TRIGGER "trg_solicitudes_alta_update"
BEFORE UPDATE OF "prioridad", "justificacion_prioridad", "fecha_objetivo" ON "solicitudes"
WHEN NEW."prioridad" = 'Alta'
  AND (NEW."justificacion_prioridad" IS NULL OR length(trim(NEW."justificacion_prioridad")) = 0 OR NEW."fecha_objetivo" IS NULL)
BEGIN SELECT RAISE(ABORT, 'JUSTIFICACION_ALTA_REQUERIDA'); END;
CREATE TRIGGER "trg_asignaciones_agente_activo" BEFORE INSERT ON "asignaciones"
WHEN NOT EXISTS (
  SELECT 1 FROM "usuarios" u JOIN "roles" r ON r."id" = u."rol_id"
  WHERE u."id" = NEW."agente_id" AND r."codigo" = 'AGENTE' AND u."estado" = 'Activo'
)
BEGIN SELECT RAISE(ABORT, 'AGENTE_NO_ACTIVO'); END;
CREATE TRIGGER "trg_asignaciones_una_vigente" BEFORE INSERT ON "asignaciones"
WHEN NEW."vigente" = 1
  AND EXISTS (SELECT 1 FROM "asignaciones" WHERE "solicitud_id" = NEW."solicitud_id" AND "vigente" = 1)
BEGIN SELECT RAISE(ABORT, 'ASIGNACION_VIGENTE_DUPLICADA'); END;
CREATE TRIGGER "trg_asignaciones_sin_update" BEFORE UPDATE ON "asignaciones"
WHEN NOT (OLD."vigente" = 1 AND NEW."vigente" = 0
  AND NEW."solicitud_id" = OLD."solicitud_id" AND NEW."agente_id" = OLD."agente_id"
  AND NEW."asignado_por" = OLD."asignado_por" AND NEW."asignado_en" = OLD."asignado_en")
BEGIN SELECT RAISE(ABORT, 'ASIGNACION_INMUTABLE'); END;
CREATE TRIGGER "trg_asignaciones_sin_delete" BEFORE DELETE ON "asignaciones"
BEGIN SELECT RAISE(ABORT, 'ASIGNACION_INMUTABLE'); END;
CREATE TRIGGER "trg_comentarios_no_vacio" BEFORE INSERT ON "comentarios"
WHEN length(trim(NEW."contenido")) = 0
BEGIN SELECT RAISE(ABORT, 'COMENTARIO_VACIO'); END;
CREATE TRIGGER "trg_comentarios_sin_update" BEFORE UPDATE ON "comentarios"
BEGIN SELECT RAISE(ABORT, 'COMENTARIO_INMUTABLE'); END;
CREATE TRIGGER "trg_comentarios_sin_delete" BEFORE DELETE ON "comentarios"
BEGIN SELECT RAISE(ABORT, 'COMENTARIO_INMUTABLE'); END;
CREATE TRIGGER "trg_cierres_validos" BEFORE INSERT ON "cierres"
WHEN NEW."tipo" NOT IN ('CONFIRMACION', 'REAPERTURA')
  OR (NEW."tipo" = 'REAPERTURA' AND (NEW."motivo" IS NULL OR length(trim(NEW."motivo")) = 0))
BEGIN SELECT RAISE(ABORT, 'CIERRE_INVALIDO'); END;
CREATE TRIGGER "trg_cierres_sin_update" BEFORE UPDATE ON "cierres"
BEGIN SELECT RAISE(ABORT, 'CIERRE_INMUTABLE'); END;
CREATE TRIGGER "trg_cierres_sin_delete" BEFORE DELETE ON "cierres"
BEGIN SELECT RAISE(ABORT, 'CIERRE_INMUTABLE'); END;
CREATE INDEX "exportaciones_creada_en_idx" ON "exportaciones"("creada_en");
CREATE TRIGGER "trg_exportaciones_sin_update" BEFORE UPDATE ON "exportaciones"
BEGIN SELECT RAISE(ABORT, 'EXPORTACION_INMUTABLE'); END;
CREATE TRIGGER "trg_exportaciones_sin_delete" BEFORE DELETE ON "exportaciones"
BEGIN SELECT RAISE(ABORT, 'EXPORTACION_INMUTABLE'); END;
DELETE FROM "sqlite_sequence";
INSERT INTO "sqlite_sequence" VALUES('roles',4);
INSERT INTO "sqlite_sequence" VALUES('categorias',6);
INSERT INTO "sqlite_sequence" VALUES('usuarios',7);
COMMIT;
