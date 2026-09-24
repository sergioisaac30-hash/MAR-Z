// Controlador de inicio y cierre de sesión.
export function crearControladorAuth({ services, config }) {
  const cookieOptions = {
    httpOnly: true,
    sameSite: 'strict',
    secure: config.isProduction,
    path: '/',
  };

  return {
    async login(req, res) {
      const { email, password } = req.valid.body;
      const { token, expiraEn, usuario } = await services.auth.login(email, password);
      res.cookie(config.cookieName, token, { ...cookieOptions, expires: expiraEn });
      res.json({ usuario, expiraEn });
    },

    async logout(req, res) {
      await services.auth.logout(req.user.sesionId);
      res.clearCookie(config.cookieName, cookieOptions);
      res.status(204).end();
    },

    me(req, res) {
      const { sesionId: _omitido, sesionExpiraEn, ...usuario } = req.user;
      res.json({ usuario, expiraEn: sesionExpiraEn });
    },
  };
}
