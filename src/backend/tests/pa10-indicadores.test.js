// PA-10 · HU10 Indicadores agregados
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearContexto } from './helpers/context.js';
import { mediana } from '../src/services/indicadorService.js';

let ctx;
let coordinador;
beforeAll(async () => {
  ctx = await crearContexto();
  coordinador = await ctx.comoUsuario('coordinador');
});
afterAll(() => ctx.cerrar());

const indicadores = (qs = {}) => coordinador.get(`/api/indicadores?${new URLSearchParams(qs)}`);
const sinFecha = ({ generadoEn: _g, ...resto }) => resto;

async function medianaEsperada(where = {}) {
  const cerradas = await ctx.prisma.solicitud.findMany({ where: { ...where, estadoId: 'Cerrada' } });
  const horas = cerradas.map((s) => (s.cerradaEn - s.creadaEn) / 3600000).sort((a, b) => a - b);
  return { horas: horas.length ? Math.round(mediana(horas) * 10) / 10 : null, muestras: horas.length };
}

describe('PA-10 · HU10 Indicadores agregados', () => {
  it('mediana(): impar, par y vacío', () => {
    expect(mediana([5, 1, 3])).toBe(3);
    expect(mediana([4, 1, 3, 2])).toBe(2.5);
    expect(mediana([])).toBeNull();
  });

  it('CA1: muestra el volumen por estado (todos los estados, incluidos los que están en cero)', async () => {
    const res = await indicadores();
    expect(res.status).toBe(200);
    const estados = await ctx.prisma.estado.findMany({ orderBy: { orden: 'asc' } });
    expect(res.body.volumenPorEstado.map((v) => v.estado)).toEqual(estados.map((e) => e.codigo));
    for (const { estado, cantidad } of res.body.volumenPorEstado) {
      expect(cantidad).toBe(await ctx.prisma.solicitud.count({ where: { estadoId: estado } }));
    }
    expect(res.body.total).toBe(await ctx.prisma.solicitud.count());
  });

  it('CA2: muestra el tiempo mediano de ciclo (creación → cierre confirmado)', async () => {
    const res = await indicadores();
    const esperado = await medianaEsperada();
    expect(res.body.tiempoMedianoCiclo).toMatchObject(esperado);
  });

  it('CA3: filtros por estado, prioridad y categoría aplicados a todos los indicadores', async () => {
    const res = await indicadores({ prioridad: 'Media' });
    expect(res.body.total).toBe(await ctx.prisma.solicitud.count({ where: { prioridadId: 'Media' } }));
    expect(res.body.tiempoMedianoCiclo).toMatchObject(await medianaEsperada({ prioridadId: 'Media' }));

    const porCategoria = await indicadores({ categoriaId: 2 });
    expect(porCategoria.body.total).toBe(await ctx.prisma.solicitud.count({ where: { categoriaId: 2 } }));

    const soloNuevas = await indicadores({ estado: 'Nuevo' });
    expect(soloNuevas.body.volumenPorEstado.filter((v) => v.cantidad > 0).map((v) => v.estado)).toEqual(['Nuevo']);
    expect(soloNuevas.body.tiempoMedianoCiclo).toMatchObject({ horas: null, muestras: 0 });
  });

  it('CA3: los filtros son reproducibles (misma consulta → mismo resultado) y se devuelven en la respuesta', async () => {
    const qs = { estado: 'Nuevo', prioridad: 'Baja', categoriaId: '6' };
    const a = await indicadores(qs);
    const b = await indicadores({ categoriaId: '6', prioridad: 'Baja', estado: 'Nuevo' });
    expect(sinFecha(a.body)).toEqual(sinFecha(b.body));
    expect(a.body.filtros).toEqual({ estado: 'Nuevo', prioridad: 'Baja', categoriaId: 6 });
  });

  it('CA4: cuenta los eventos registrados por tipo, una vez por acción', async () => {
    const res = await indicadores();
    const tipos = Object.fromEntries(res.body.eventosPorTipo.map((e) => [e.accion, e.cantidad]));
    expect(Object.keys(tipos)).toEqual(['PRIORIDAD_CAMBIADA', 'ASIGNACION', 'ESTADO_CAMBIADO', 'COMENTARIO_REGISTRADO', 'CONFIRMACION', 'REAPERTURA']);
    expect(tipos.REAPERTURA).toBe(await ctx.prisma.cierre.count({ where: { tipo: 'REAPERTURA' } }));
    expect(tipos.CONFIRMACION).toBe(await ctx.prisma.cierre.count({ where: { tipo: 'CONFIRMACION' } }));
    expect(tipos.COMENTARIO_REGISTRADO).toBe(await ctx.prisma.comentario.count());
    expect(tipos.ASIGNACION).toBe(await ctx.prisma.asignacion.count());
  });

  it('CA5: no presenta rankings ni datos de personas', async () => {
    const res = await indicadores();
    const texto = JSON.stringify(res.body);
    const usuarios = await ctx.prisma.usuario.findMany();
    for (const u of usuarios) {
      expect(texto).not.toContain(u.nombre);
      expect(texto).not.toContain(u.codigoActor);
      expect(texto).not.toContain(u.email);
    }
    expect(texto).not.toMatch(/agente|ranking|usuario|actor|puntuaci/i);
  });

  it('Solo el coordinador consulta los indicadores', async () => {
    for (const clave of ['solNorte', 'agente1', 'auditor']) {
      const u = await ctx.comoUsuario(clave);
      expect((await u.get('/api/indicadores')).status).toBe(403);
    }
  });

  it('Filtros no válidos se rechazan', async () => {
    expect((await indicadores({ estado: 'Otro' })).status).toBe(400);
    expect((await indicadores({ prioridad: 'Crítica' })).status).toBe(400);
  });
});
