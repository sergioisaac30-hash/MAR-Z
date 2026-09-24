import jwt from 'jsonwebtoken';
import { forbidden, unauthorized } from './errorHandler.js';

// Revisa que el token de la cookie sea válido y que la sesión siga activa.
export function verificarSesion({ config, services }) {
  return async (req, _res, next) => {
    const token = req.cookies?.[config.cookieName];
    if (!token) return next(unauthorized());
    let payload;
    try {
      payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
    } catch {
      return next(unauthorized('La sesión no es válida o ha expirado.'));
    }
    const usuario = await services.auth.usuarioDeSesion(payload.jti, Number(payload.sub));
    if (!usuario) return next(unauthorized('La sesión no es válida o ha expirado.'));
    req.user = usuario;
    return next();
  };
}

// Bloquea el paso si el usuario no tiene uno de los roles permitidos.
export function permitirRoles(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.rol)) return next(forbidden());
    return next();
  };
}
