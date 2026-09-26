// PA-09 · HU09 Buscar y filtrar solicitudes
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearContexto } from './helpers/context.js';

let ctx;
let coordinador;
let solNorte;
let agente1;
beforeAll(async () => {
  ctx = await crearContexto();
  coordinador = await ctx.comoUsuario('coordinador');
  solNorte = await ctx.comoUsuario('solNorte');
  agente1 = await ctx.comoUsuario('agente1');
});
afterAll(() => ctx.cerrar());

const listar = (u, qs) => u.get(`/api/solicitudes?${new URLSearchParams(qs)}`);

describe('PA-09 · HU09 Buscar y filtrar solicitudes', () => {
  it('CA1: busca por texto en el título y en la descripción', async () => {
    const referencia = await ctx.prisma.solicitud.findFirst({ orderBy: { id: 'asc' } });
    const palabra = referencia.titulo.split(' ').find((p) => p.length > 4);
    const porTitulo = await listar(coordinador, { q: palabra });
    expect(porTitulo.body.datos.map((s) => s.id)).toContain(referencia.id);
    expect(porTitulo.body.datos.every((s) => new RegExp(palabra, 'i').test(`${s.titulo} ${s.descripcion}`))).toBe(true);

    const palabraDescripcion = referencia.descripcion.split(' ').find((p) => p.length > 5 && !referencia.titulo.includes(p));
    if (palabraDescripcion) {
      const porDescripcion = await listar(coordinador, { q: palabraDescripcion });
      expect(porDescripcion.body.datos.map((s) => s.id)).toContain(referencia.id);
    }
  });

  it('CA2: filtra por estado, prioridad y categoría', async () => {
    const unEstado = (await ctx.prisma.solicitud.findFirst()).estadoId;
    const porEstado = (await listar(coordinador, { estado: unEstado })).body.datos;
    expect(porEstado.length).toBe(await ctx.prisma.solicitud.count({ where: { estadoId: unEstado } }));
    expect(porEstado.every((s) => s.estado === unEstado)).toBe(true);

    const porPrioridad = (await listar(coordinador, { prioridad: 'Baja' })).body.datos;
    expect(porPrioridad.length).toBe(await ctx.prisma.solicitud.count({ where: { prioridadId: 'Baja' } }));
    expect(porPrioridad.every((s) => s.prioridad === 'Baja')).toBe(true);

    const porCategoria = (await listar(coordinador, { categoriaId: 2 })).body.datos;
    expect(porCategoria.length).toBe(await ctx.prisma.solicitud.count({ where: { categoriaId: 2 } }));
    expect(porCategoria.every((s) => s.categoria.id === 2)).toBe(true);
  });

  it('CA4: la combinación de filtros es consistente (intersección de cada filtro)', async () => {
    const referencia = await ctx.prisma.solicitud.findFirst({ orderBy: { id: 'asc' } });
    const palabra = referencia.titulo.split(' ').find((p) => p.length > 4);
    const combinacion = { estado: referencia.estadoId, prioridad: referencia.prioridadId, categoriaId: referencia.categoriaId, q: palabra };
    const ids = (qs) => listar(coordinador, qs).then((r) => new Set(r.body.datos.map((s) => s.id)));
    const [todos, ...parciales] = await Promise.all([
      ids(combinacion),
      ...Object.entries(combinacion).map(([k, v]) => ids({ [k]: v })),
    ]);
    const interseccion = [...parciales[0]].filter((id) => parciales.every((p) => p.has(id)));
    expect([...todos].sort()).toEqual(interseccion.sort());
    expect(todos.has(referencia.id)).toBe(true);
    // El orden de los parámetros no altera el resultado.
    const invertido = { q: palabra, categoriaId: referencia.categoriaId, prioridad: referencia.prioridadId, estado: referencia.estadoId };
    expect([...(await ids(invertido))]).toEqual([...todos]);
  });

  it('CA4: una combinación sin coincidencias devuelve una lista vacía', async () => {
    const res = await listar(coordinador, { estado: 'Nuevo', q: 'texto-que-no-existe-en-ninguna-solicitud-xyz' });
    expect(res.status).toBe(200);
    expect(res.body.datos).toEqual([]);
  });

  it('CA3: respeta permisos — el solicitante solo encuentra lo propio', async () => {
    const ajena = await ctx.prisma.solicitud.findFirst({ where: { solicitanteId: { not: solNorte.usuario.id } } });
    const palabra = ajena.titulo.split(' ').find((p) => p.length > 4);
    const res = await listar(solNorte, { q: palabra });
    expect(res.body.datos.every((s) => s.solicitante.nombre === 'Tú')).toBe(true);
    expect(res.body.datos.map((s) => s.id)).not.toContain(ajena.id);
    // Buscar el código de una solicitud ajena tampoco la revela.
    expect((await listar(solNorte, { q: `SOL-${String(ajena.id).padStart(5, '0')}` })).body.datos).toEqual([]);
  });

  it('CA3: respeta permisos — el agente solo filtra entre sus asignadas', async () => {
    const res = await listar(agente1, { estado: 'En progreso' });
    const propias = await ctx.prisma.solicitud.count({ where: { estadoId: 'En progreso', asignaciones: { some: { agenteId: agente1.usuario.id, vigente: true } } } });
    expect(res.body.datos).toHaveLength(propias);
  });

  it('CA3: el auditor no accede al listado de solicitudes', async () => {
    const auditor = await ctx.comoUsuario('auditor');
    expect((await listar(auditor, { q: 'red' })).status).toBe(403);
  });

  it('Filtros con valores no válidos se rechazan', async () => {
    for (const qs of [{ estado: 'Pendiente' }, { prioridad: 'Urgente' }, { categoriaId: 'x' }, { q: 'x'.repeat(201) }]) {
      expect((await listar(coordinador, qs)).status).toBe(400);
    }
  });

  it('Un filtro vacío equivale a no filtrar', async () => {
    const todos = (await listar(coordinador, {})).body.datos.length;
    expect((await listar(coordinador, { estado: '', prioridad: '', categoriaId: '', q: '' })).body.datos).toHaveLength(todos);
  });
});
