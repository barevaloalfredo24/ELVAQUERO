// =====================================================================
// SERVICIO DE REPORTES
// ---------------------------------------------------------------------
// Agrega los datos de ventas para las gráficas del panel, usando la
// vista vista_ventas_diarias y consultas SQL directas. Acepta filtros
// de rango de fechas, categoría y método de pago.
// =====================================================================

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Filtros que puede recibir el endpoint.
export interface FiltrosReporte {
  desde?: string; // YYYY-MM-DD
  hasta?: string; // YYYY-MM-DD
  categoria?: string; // slug
  metodoPago?: string; // 'tarjeta' | 'contra_entrega'
}

// Forma del reporte que consume el frontend.
export interface ReporteDTO {
  resumen: {
    ingresos: number;
    ordenes: number;
    ticketPromedio: number;
    unidadesVendidas: number;
  };
  serieTiempo: { fecha: string; ingresos: number; ordenes: number }[];
  porCategoria: { categoria: string; ingresos: number; ordenes: number }[];
  porMetodoPago: { metodo: string; ingresos: number; porcentaje: number }[];
  histograma: { rango: string; ordenes: number }[];
}

@Injectable()
export class ReportesService {
  constructor(private prisma: PrismaService) {}

  // Cláusula WHERE base sobre órdenes "efectivas" + filtros.
  private baseWhere(f: FiltrosReporte): Prisma.Sql {
    const partes: Prisma.Sql[] = [
      Prisma.sql`o.estado IN ('pagado','procesando','enviado','entregado')`,
    ];
    if (f.desde) {
      partes.push(
        Prisma.sql`o.fecha_creacion >= ${new Date(`${f.desde}T00:00:00`)}`,
      );
    }
    if (f.hasta) {
      partes.push(
        Prisma.sql`o.fecha_creacion <= ${new Date(`${f.hasta}T23:59:59`)}`,
      );
    }
    if (f.metodoPago) {
      partes.push(Prisma.sql`o.metodo_pago::text = ${f.metodoPago}`);
    }
    if (f.categoria) {
      partes.push(Prisma.sql`EXISTS (
        SELECT 1 FROM items_orden io2
        JOIN variantes_producto v2 ON v2.id = io2.variante_id
        JOIN productos p2 ON p2.id = v2.producto_id
        JOIN categorias c2 ON c2.id = p2.categoria_id
        WHERE io2.orden_id = o.id AND c2.slug = ${f.categoria}
      )`);
    }
    return Prisma.join(partes, ' AND ');
  }

  // Genera el reporte completo según los filtros.
  async generarReporte(f: FiltrosReporte): Promise<ReporteDTO> {
    const base = this.baseWhere(f);

    // --- Resumen (ingresos, órdenes) ---
    const resumen = await this.prisma.$queryRaw<
      { ingresos: number; ordenes: number }[]
    >(Prisma.sql`
      SELECT COALESCE(SUM(o.total), 0)::float AS ingresos,
             COUNT(DISTINCT o.id)::int AS ordenes
      FROM ordenes o
      WHERE ${base}
    `);
    const ingresos = Number(resumen[0]?.ingresos ?? 0);
    const ordenes = Number(resumen[0]?.ordenes ?? 0);

    // --- Unidades vendidas ---
    const unidades = await this.prisma.$queryRaw<
      { unidades: number }[]
    >(Prisma.sql`
      SELECT COALESCE(SUM(io.cantidad), 0)::int AS unidades
      FROM ordenes o
      JOIN items_orden io ON io.orden_id = o.id
      WHERE ${base}
    `);
    const unidadesVendidas = Number(unidades[0]?.unidades ?? 0);

    // --- Serie de tiempo (por día) ---
    const serieTiempo = await this.prisma.$queryRaw<
      { fecha: string; ingresos: number; ordenes: number }[]
    >(Prisma.sql`
      SELECT to_char(o.fecha_creacion, 'YYYY-MM-DD') AS fecha,
             SUM(o.total)::float AS ingresos,
             COUNT(DISTINCT o.id)::int AS ordenes
      FROM ordenes o
      WHERE ${base}
      GROUP BY 1
      ORDER BY 1 ASC
    `);

    // --- Ventas por categoría ---
    const porCategoria = await this.prisma.$queryRaw<
      { categoria: string; ingresos: number; ordenes: number }[]
    >(Prisma.sql`
      SELECT COALESCE(c.nombre, 'Sin categoría') AS categoria,
             SUM(io.subtotal)::float AS ingresos,
             COUNT(DISTINCT o.id)::int AS ordenes
      FROM ordenes o
      JOIN items_orden io ON io.orden_id = o.id
      JOIN variantes_producto v ON v.id = io.variante_id
      JOIN productos p ON p.id = v.producto_id
      LEFT JOIN categorias c ON c.id = p.categoria_id
      WHERE ${base}
      GROUP BY c.nombre
      ORDER BY ingresos DESC
    `);

    // --- Ventas por método de pago (con porcentaje) ---
    const porMetodoRaw = await this.prisma.$queryRaw<
      { metodo: string; ingresos: number }[]
    >(Prisma.sql`
      SELECT o.metodo_pago::text AS metodo,
             SUM(o.total)::float AS ingresos
      FROM ordenes o
      WHERE ${base}
      GROUP BY 1
      ORDER BY ingresos DESC
    `);
    const totalMetodos = porMetodoRaw.reduce(
      (acc, m) => acc + Number(m.ingresos),
      0,
    );
    const porMetodoPago = porMetodoRaw.map((m) => ({
      metodo: m.metodo === 'contra_entrega' ? 'Contra entrega' : 'Tarjeta',
      ingresos: Number(m.ingresos),
      porcentaje: totalMetodos
        ? Math.round((Number(m.ingresos) / totalMetodos) * 1000) / 10
        : 0,
    }));

    // --- Histograma de montos de orden ---
    const histograma = await this.prisma.$queryRaw<
      { rango: string; ordenes: number }[]
    >(Prisma.sql`
      SELECT CASE
        WHEN o.total < 100 THEN 'Menos de Q100'
        WHEN o.total < 300 THEN 'Q100 - Q300'
        WHEN o.total < 500 THEN 'Q300 - Q500'
        WHEN o.total < 1000 THEN 'Q500 - Q1000'
        ELSE 'Más de Q1000'
      END AS rango,
      COUNT(*)::int AS ordenes
      FROM ordenes o
      WHERE ${base}
      GROUP BY 1
      ORDER BY MIN(o.total) ASC
    `);

    return {
      resumen: {
        ingresos,
        ordenes,
        ticketPromedio: ordenes
          ? Math.round((ingresos / ordenes) * 100) / 100
          : 0,
        unidadesVendidas,
      },
      serieTiempo,
      porCategoria,
      porMetodoPago,
      histograma,
    };
  }
}
