import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ESTADO_USUARIO } from '../domain/constantes.js';
import { ErrorApp } from '../middleware/errorHandler.js';

const credencialesInvalidas = () =>
  new ErrorApp(401, 'CREDENCIALES_INVALIDAS', 'No fue posible iniciar sesión.');

// Datos del usuario que sí se pueden mostrar (sin la contraseña).
export function perfilPublico(usuario) {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol.codigo,
    rolNombre: usuario.rol.nombre,
    codigoActor: usuario.codigoActor,
  };
}

export function hashPassword(password, rounds) {
  return bcrypt.hash(password, rounds);
}

export function crearServicioAuth({ prisma, config }) {
  // Hash falso: si el correo no existe, igual se compara para que el tiempo de
  // respuesta no delate si el usuario existe o no.
  const hashSenuelo = bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), config.bcryptRounds);

  return {
    // HU01 · Si las credenciales son válidas abre sesión; si no, siempre el mismo error.
    async login(email, password) {
      const usuario = await prisma.usuario.findUnique({
        where: { email: email.trim().toLowerCase() },
        include: { rol: true },
      });
      const coincide = await bcrypt.compare(password, usuario?.passwordHash ?? hashSenuelo);
      if (!usuario || !coincide || usuario.estado !== ESTADO_USUARIO.ACTIVO) throw credencialesInvalidas();

      const sesionId = crypto.randomBytes(24).toString('base64url');
      const expiraEn = new Date(Date.now() + config.sessionHours * 3600 * 1000);
      await prisma.sesion.create({ data: { id: sesionId, usuarioId: usuario.id, expiraEn } });
      const token = jwt.sign({ sub: String(usuario.id), rol: usuario.rol.codigo }, config.jwtSecret, {
        algorithm: 'HS256',
        jwtid: sesionId,
        expiresIn: config.sessionHours * 3600,
      });
      return { token, expiraEn, usuario: perfilPublico(usuario) };
    },

    // Devuelve el usuario si la sesión existe, no fue cerrada, no expiró y el usuario sigue activo.
    async usuarioDeSesion(sesionId, usuarioId) {
      if (!sesionId || !Number.isInteger(usuarioId)) return null;
      const sesion = await prisma.sesion.findUnique({
        where: { id: sesionId },
        include: { usuario: { include: { rol: true } } },
      });
      if (!sesion || sesion.usuarioId !== usuarioId || sesion.revocadaEn) return null;
      if (sesion.expiraEn <= new Date()) return null;
      if (sesion.usuario.estado !== ESTADO_USUARIO.ACTIVO) return null;
      return { ...perfilPublico(sesion.usuario), sesionId: sesion.id, sesionExpiraEn: sesion.expiraEn };
    },

    // HU01 · Cierra la sesión: la marca como revocada en el servidor.
    async logout(sesionId) {
      await prisma.sesion.updateMany({ where: { id: sesionId, revocadaEn: null }, data: { revocadaEn: new Date() } });
    },
  };
}
