// Controlador de solicitudes: recibe la petición y llama al servicio.
export function crearControladorSolicitud({ services }) {
  const { solicitudes, asignaciones, comentarios, flujo } = services;
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
    // HU05
    async asignar(req, res) {
      res.json(await asignaciones.asignar(req.user, req.valid.params.id, req.valid.body.agenteId));
    },
    // HU06
    async listarComentarios(req, res) {
      res.json({ datos: await comentarios.listar(req.user, req.valid.params.id) });
    },
    async comentar(req, res) {
      res.status(201).json(await comentarios.crear(req.user, req.valid.params.id, req.valid.body.contenido));
    },
    // HU07
    async transiciones(req, res) {
      res.json(await flujo.transiciones(req.user, req.valid.params.id));
    },
    async cambiarEstado(req, res) {
      res.json(await flujo.cambiarEstado(req.user, req.valid.params.id, req.valid.body.estado));
    },
    async historial(req, res) {
      res.json({ datos: await flujo.historial(req.user, req.valid.params.id) });
    },
    // HU08
    async confirmar(req, res) {
      res.json(await flujo.confirmar(req.user, req.valid.params.id));
    },
    async reabrir(req, res) {
      res.json(await flujo.reabrir(req.user, req.valid.params.id, req.valid.body.motivo));
    },
  };
}
