import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const TMP_DIR = path.join(root, 'tests/.tmp');
export const TEMPLATE_DB = path.join(TMP_DIR, 'plantilla.db');

/** Crea una base plantilla con todas las migraciones aplicadas; cada archivo de prueba la copia. */
export default function setup() {
  fs.rmSync(TMP_DIR, { recursive: true, force: true });
  fs.mkdirSync(TMP_DIR, { recursive: true });
  execSync('npx prisma migrate deploy', {
    cwd: root,
    env: { ...process.env, DATABASE_URL: `file:${TEMPLATE_DB}` },
    stdio: 'pipe',
  });
  return () => fs.rmSync(TMP_DIR, { recursive: true, force: true });
}
