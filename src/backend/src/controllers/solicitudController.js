// Controlador de solicitudes: recibe la petición y llama al servicio.
export function crearControladorSolicitud({ services }) {
  const { solicitudes } = services;
  return {
    async crear(req, res) {
      res.status(201).json(await solicitudes.crear(req.user, req.valid.body));
    },
    async listar(req, res) {
      res.json({ datos: await solicitudes.listar(req.user, req.valid.query) });
    },
    async obtener(req, res) {
      res.json(await solicitudes.obtener(req.user, req.valid.params.id));
    },
    async cambiarPrioridad(req, res) {
      res.json(await solicitudes.cambiarPrioridad(req.user, req.valid.params.id, req.valid.body));
    },
    async eliminar(req, res) {
      await solicitudes.eliminar(req.user, req.valid.params.id);
      res.status(204).end();
    },
  };
}
