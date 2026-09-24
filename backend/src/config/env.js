import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

// Carpeta raíz del backend (dos niveles arriba de este archivo).
export const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// Si existe un archivo .env local, se carga antes de leer las variables.
const envFile = path.join(backendRoot, '.env');
if (fs.existsSync(envFile) && typeof process.loadEnvFile === 'function') {
  process.loadEnvFile(envFile);
}

const nodeEnv = process.env.NODE_ENV ?? 'development';
const isProduction = nodeEnv === 'production';
const isTest = nodeEnv === 'test';

// Lee una variable de entorno como número entero, con un valor por defecto.
function entero(nombre, porDefecto) {
  const crudo = process.env[nombre];
  if (crudo === undefined || crudo === '') return porDefecto;
  const valor = Number.parseInt(crudo, 10);
  if (Number.isNaN(valor)) throw new Error(`La variable ${nombre} debe ser un número entero`);
  return valor;
}

// Obtiene el secreto para firmar sesiones; en producción es obligatorio.
function resolverSecretoJwt() {
  const secreto = process.env.JWT_SECRET;
  if (secreto && secreto.length >= 32) return secreto;
  if (secreto) throw new Error('JWT_SECRET debe tener al menos 32 caracteres');
  if (isProduction) throw new Error('JWT_SECRET es obligatorio en producción');
  if (!isTest) {
    console.warn('[config] JWT_SECRET no definido: se usa un secreto temporal; las sesiones se invalidan al reiniciar.');
  }
  return crypto.randomBytes(32).toString('hex');
}

// Configuración de la app, leída una sola vez desde las variables de entorno.
export const config = Object.freeze({
  nodeEnv,
  isProduction,
  isTest,
  port: entero('PORT', 4000),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: resolverSecretoJwt(),
  sessionHours: entero('SESSION_HOURS', 8),
  bcryptRounds: entero('BCRYPT_ROUNDS', 12),
  loginMaxAttempts: entero('LOGIN_MAX_ATTEMPTS', 10),
  loginWindowMinutes: entero('LOGIN_WINDOW_MINUTES', 15),
  cookieName: 'mesa_sesion',
  frontendDist: path.resolve(backendRoot, '../frontend/dist'),
});
