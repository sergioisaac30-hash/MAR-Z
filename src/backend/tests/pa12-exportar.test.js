// PA-12 · HU12 Exportar reporte (+ CAM-02: el CSV excluye texto libre)
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearContexto } from './helpers/context.js';
import { COLUMNAS_REPORTE } from '../src/services/exportacionService.js';
import { celdaCsv, generarCsv } from '../src/utils/csv.js';

let ctx;
let coordinador;
beforeAll(async () => {
  ctx = await crearContexto();
  coordinador = await ctx.comoUsuario('coordinador');
});
afterAll(() => ctx.cerrar());

const exportar = (filtros = {}) => coordinador.post('/api/reportes/solicitudes', filtros);

/** Lectura mínima del CSV generado (sin comillas en los datos de este reporte). */
function leer(texto) {
  const [cabecera, ...filas] = texto.replace(/^﻿/, '').trimEnd().split('\r\n');
  const columnas = cabecera.split(',');
  return filas.filter(Boolean).map((l) => Object.fromEntries(l.split(',').map((v, i) => [columnas[i], v])));
}

describe('PA-12 · HU12 Exportar reporte', () => {
  it('CA1: exporta en formato CSV descargable con cabecera fija', async () => {
    const res = await exportar();
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/^text\/csv; charset=utf-8/);
    expect(res.headers['content-disposition']).toMatch(/^attachment; filename="solicitudes-\d{8}-\d{4}\.csv"$/);
    expect(res.text.startsWith('﻿')).toBe(true);
    expect(res.text.replace(/^﻿/, '').split('\r\n')[0]).toBe(COLUMNAS_REPORTE.join(','));
    expect(leer(res.text)).toHaveLength(await ctx.prisma.solicitud.count());
  });

  it('CA2: respeta los filtros aplicados (estado, prioridad, categoría y texto)', async () => {
    const unEstado = (await ctx.prisma.solicitud.findFirst()).estadoId;
    const porEstado = leer((await exportar({ estado: unEstado })).text);
    expect(porEstado).toHaveLength(await ctx.prisma.solicitud.count({ where: { estadoId: unEstado } }));
    expect(porEstado.every((f) => f.estado === unEstado)).toBe(true);

    const combinado = leer((await exportar({ prioridad: 'Baja', categoriaId: 6 })).text);
    expect(combinado).toHaveLength(await ctx.prisma.solicitud.count({ where: { prioridadId: 'Baja', categoriaId: 6 } }));

    const referencia = await ctx.prisma.solicitud.findFirst({ orderBy: { id: 'asc' } });
    const palabra = referencia.titulo.split(' ').find((p) => p.length > 4);
    const porTexto = leer((await exportar({ q: palabra })).text);
    expect(porTexto.map((f) => f.codigo)).toContain(`SOL-${String(referencia.id).padStart(5, '0')}`);
  });

  it('CA2: los mismos filtros que el listado producen las mismas solicitudes', async () => {
    const unEstado = (await ctx.prisma.solicitud.findFirst()).estadoId;
    const filtros = { estado: unEstado };
    const listado = (await coordinador.get(`/api/solicitudes?${new URLSearchParams(filtros)}`)).body.datos.map((s) => s.codigo).sort();
    expect(leer((await exportar(filtros)).text).map((f) => f.codigo).sort()).toEqual(listado);
  });

  it('CA3: excluye credenciales y datos personales', async () => {
    const texto = (await exportar()).text;
    for (const u of await ctx.prisma.usuario.findMany()) {
      expect(texto).not.toContain(u.email);
      expect(texto).not.toContain(u.passwordHash);
      expect(texto).not.toContain(u.nombre);
      expect(texto).not.toContain(u.codigoActor);
    }
    expect(texto).not.toMatch(/password|contrase|hash|token|sesion/i);
  });

  it('CA4 / CAM-02: excluye el texto libre (títulos, descripciones, justificaciones, motivos y comentarios)', async () => {
    const texto = (await exportar()).text;
    const solicitudes = await ctx.prisma.solicitud.findMany();
    for (const s of solicitudes) {
      expect(texto).not.toContain(s.titulo);
      expect(texto).not.toContain(s.descripcion);
      if (s.justificacionPrioridad) expect(texto).not.toContain(s.justificacionPrioridad);
    }
    for (const c of await ctx.prisma.comentario.findMany()) expect(texto).not.toContain(c.contenido);
    for (const c of await ctx.prisma.cierre.findMany({ where: { motivo: { not: null } } })) expect(texto).not.toContain(c.motivo);
    expect(COLUMNAS_REPORTE).not.toEqual(expect.arrayContaining(['titulo', 'descripcion', 'justificacion', 'motivo', 'comentario', 'agente']));
  });

  it('CA5: la exportación queda registrada (tabla exportaciones y auditoría)', async () => {
    const antes = await ctx.prisma.exportacion.count();
    await exportar({ prioridad: 'Alta' });
    const registro = await ctx.prisma.exportacion.findFirst({ orderBy: { id: 'desc' } });
    expect(await ctx.prisma.exportacion.count()).toBe(antes + 1);
    expect(registro).toMatchObject({ usuarioId: coordinador.usuario.id, filas: await ctx.prisma.solicitud.count({ where: { prioridadId: 'Alta' } }) });
    expect(JSON.parse(registro.filtros)).toEqual({ prioridad: 'Alta' });

    const auditor = await ctx.comoUsuario('auditor');
    const [evento] = (await auditor.get('/api/auditoria?accion=EXPORTACION')).body.datos;
    expect(evento).toMatchObject({ actor: coordinador.usuario.codigoActor, campo: 'reporte_solicitudes' });
    expect(evento.valorNuevo).toContain(`Exportación #${registro.id}`);
  });

  it('CA5: una exportación sin resultados también se registra', async () => {
    const res = await exportar({ estado: 'Nuevo', q: 'texto-que-no-existe-en-ninguna-solicitud-xyz' });
    expect(leer(res.text)).toHaveLength(0);
    expect((await ctx.prisma.exportacion.findFirst({ orderBy: { id: 'desc' } })).filas).toBe(0);
  });

  it('El registro de exportaciones no puede modificarse', async () => {
    const e = await ctx.prisma.exportacion.findFirst();
    await expect(ctx.prisma.exportacion.update({ where: { id: e.id }, data: { filas: 0 } })).rejects.toThrow(/no pueden modificarse/);
    await expect(ctx.prisma.$executeRawUnsafe(`DELETE FROM exportaciones WHERE id = ${e.id}`)).rejects.toMatchObject({ meta: { message: 'EXPORTACION_INMUTABLE' } });
  });

  it('Solo el coordinador exporta; filtros inválidos se rechazan sin registrar nada', async () => {
    const antes = await ctx.prisma.exportacion.count();
    for (const clave of ['solNorte', 'agente1', 'auditor']) {
      const u = await ctx.comoUsuario(clave);
      expect((await u.post('/api/reportes/solicitudes', {})).status).toBe(403);
    }
    expect((await exportar({ estado: 'Inexistente' })).status).toBe(400);
    expect((await ctx.request().post('/api/reportes/solicitudes').send({})).status).toBe(403); // sin cabecera anti-CSRF
    expect(await ctx.prisma.exportacion.count()).toBe(antes);
  });

  it('Formato CSV: comillas, separadores y neutralización de fórmulas', () => {
    expect(celdaCsv('a,b')).toBe('"a,b"');
    expect(celdaCsv('di "hola"')).toBe('"di ""hola"""');
    expect(celdaCsv('=SUMA(A1)')).toBe("'=SUMA(A1)");
    expect(celdaCsv(null)).toBe('');
    expect(generarCsv(['a'], [['1']])).toBe('﻿a\r\n1\r\n');
  });
});
