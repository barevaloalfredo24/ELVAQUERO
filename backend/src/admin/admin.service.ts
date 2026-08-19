// =====================================================================
// SERVICIO DE ADMINISTRACIÓN
// ---------------------------------------------------------------------
// Alimenta el panel administrativo: estadísticas (usando la vista
// vista_ventas_diarias), pedidos, clientes y alertas de stock.
// =====================================================================

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CatalogoService, ProductoDTO } from '../catalogo/catalogo.service';
import { mapearEstado } from '../common/mapeos';
import { UsuarioDTO } from '../auth/auth.service';

export interface PuntoSerie {
  etiqueta: string;
  total: number;
}

export interface EstadisticasAdminDTO {
  ventasTotales: number;
  numeroOrdenes: number;
  ticketPromedio: number;
  clientesRegistrados: number;
  productosActivos: number;
  alertasStock: number;
  ingresosPorMes: PuntoSerie[];
  ventasPorMetodoPago: PuntoSerie[];
  productosMasVendidos: {
    producto: { id: string; nombre: string };
    cantidad: number;
  }[];
}

// Estados que se consideran "venta efectiva" para reportes (como la vista).
const ESTADOS_VENTA = ['pagado', 'procesando', 'enviado', 'entregado'] as const;

// Tipo de una orden con su detalle para mapearla.
type OrdenConDetalle = Prisma.ordenesGetPayload<{
  include: {
    items_orden: {
      include: {
        variantes_producto: { select: { producto_id: true; atributos: true } };
      };
    };
    usuarios: true;
    direcciones_ordenes_direccion_envio_idTodirecciones: true;
  };
}>;

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private catalogo: CatalogoService,
  ) {}

  // Mapea una orden al DTO del frontend (mismo shape que /ordenes).
  private aOrdenDTO(o: OrdenConDetalle) {
    const direccion = o.direcciones_ordenes_direccion_envio_idTodirecciones;
    return {
      id: o.numero_orden,
      clienteId: o.usuario_id,
      clienteNombre: o.usuarios.nombre_completo,
      clienteEmail: o.usuarios.correo,
      items: o.items_orden.map((it) => {
        const at = (it.variantes_producto.atributos ?? {}) as {
          talla?: string;
          color?: string;
        };
        return {
          productoId: it.variantes_producto.producto_id,
          nombre: it.nombre_producto_snapshot,
          variante: `Talla ${at.talla ?? ''} · ${at.color ?? ''}`,
          cantidad: it.cantidad,
          precioUnitario: Number(it.precio_unitario),
          subtotal: Number(it.subtotal),
        };
      }),
      subtotal: Number(o.subtotal),
      descuento: Number(o.descuento_total),
      envio: Number(o.envio_total),
      total: Number(o.total),
      metodoPago: o.metodo_pago,
      estado: mapearEstado(o.estado, o.metodo_pago),
      direccionEnvio: direccion ? direccion.calle : '',
      telefono: o.usuarios.telefono ?? '',
      fecha: o.fecha_creacion.toISOString(),
    };
  }

  // Lista todos los pedidos (más recientes primero).
  async listarPedidos() {
    const ordenes = await this.prisma.ordenes.findMany({
      orderBy: { fecha_creacion: 'desc' },
      include: {
        items_orden: {
          include: {
            variantes_producto: {
              select: { producto_id: true, atributos: true },
            },
          },
        },
        usuarios: true,
        direcciones_ordenes_direccion_envio_idTodirecciones: true,
      },
    });
    return ordenes.map((o) => this.aOrdenDTO(o));
  }

  // Lista los clientes (rol 'cliente') con su método de registro.
  async listarClientes(): Promise<UsuarioDTO[]> {
    const [clientes, oauth] = await Promise.all([
      this.prisma.usuarios.findMany({
        where: { rol: 'cliente' },
        orderBy: { fecha_creacion: 'desc' },
      }),
      this.prisma.cuentas_oauth.findMany({ select: { usuario_id: true } }),
    ]);

    const idsOauth = new Set(oauth.map((o) => o.usuario_id));

    return clientes.map((u) => ({
      id: u.id,
      nombre: u.nombre_completo,
      email: u.correo,
      rol: u.rol,
      verificado: u.correo_verificado,
      metodoRegistro: idsOauth.has(u.id) ? 'google' : 'correo',
      telefono: u.telefono,
      fechaRegistro: u.fecha_creacion.toISOString(),
    }));
  }

  // Lista los perfiles de staff (rol 'staff').
  async listarStaff() {
    const staff = await this.prisma.usuarios.findMany({
      where: { rol: 'staff' },
      orderBy: { fecha_creacion: 'desc' },
    });
    return staff.map((u) => ({
      id: u.id,
      nombre: u.nombre_completo,
      email: u.correo,
      telefono: u.telefono,
      estaActivo: u.esta_activo,
      fechaRegistro: u.fecha_creacion.toISOString(),
    }));
  }

  // Lista todos los cupones (para el panel de administración).
  async listarCupones() {
    const cupones = await this.prisma.cupones.findMany({
      orderBy: { fecha_creacion: 'desc' },
    });
    return cupones.map((c) => ({
      id: c.id,
      codigo: c.codigo,
      tipoDescuento: c.tipo_descuento,
      valorDescuento: Number(c.valor_descuento),
      montoMinimoOrden: Number(c.monto_minimo_orden ?? 0),
      limiteUso: c.limite_uso,
      vecesUsado: c.veces_usado,
      fechaInicioValidez: c.fecha_inicio_validez.toISOString(),
      fechaFinValidez: c.fecha_fin_validez.toISOString(),
      estaActivo: c.esta_activo,
    }));
  }

  // Productos cuyo stock está por debajo de su umbral.
  async listarAlertasStock(): Promise<ProductoDTO[]> {
    const productos = await this.catalogo.listarProductos();
    return productos.filter((p) => p.stockTotal <= p.umbralStock);
  }

  // Lista todos los productos (para la tabla de administración).
  listarProductos(): Promise<ProductoDTO[]> {
    return this.catalogo.listarProductos();
  }

  // Calcula las estadísticas del panel.
  async obtenerEstadisticas(): Promise<EstadisticasAdminDTO> {
    // Órdenes que cuentan como venta efectiva.
    const ordenes = await this.prisma.ordenes.findMany({
      where: { estado: { in: [...ESTADOS_VENTA] } },
      select: { total: true, metodo_pago: true, fecha_creacion: true },
    });

    const ventasTotales = ordenes.reduce((acc, o) => acc + Number(o.total), 0);
    const numeroOrdenes = ordenes.length;
    const ticketPromedio = numeroOrdenes ? ventasTotales / numeroOrdenes : 0;

    // Agrupa ingresos por mes.
    const porMes = new Map<string, number>();
    for (const o of ordenes) {
      const etiqueta = o.fecha_creacion.toLocaleDateString('es-GT', {
        month: 'short',
      });
      porMes.set(etiqueta, (porMes.get(etiqueta) ?? 0) + Number(o.total));
    }
    const ingresosPorMes = Array.from(porMes, ([etiqueta, total]) => ({
      etiqueta,
      total,
    }));

    // Agrupa ventas por método de pago.
    const porMetodo = new Map<string, number>();
    for (const o of ordenes) {
      const clave = o.metodo_pago === 'tarjeta' ? 'Tarjeta' : 'Contra entrega';
      porMetodo.set(clave, (porMetodo.get(clave) ?? 0) + Number(o.total));
    }
    const ventasPorMetodoPago = Array.from(porMetodo, ([etiqueta, total]) => ({
      etiqueta,
      total,
    }));

    // Productos más vendidos (consulta SQL sobre items_orden).
    const masVendidos = await this.prisma.$queryRaw<
      { id: string; nombre: string; cantidad: number }[]
    >(Prisma.sql`
      SELECT p.id, p.nombre, SUM(io.cantidad)::int AS cantidad
      FROM items_orden io
      JOIN variantes_producto v ON v.id = io.variante_id
      JOIN productos p ON p.id = v.producto_id
      JOIN ordenes o ON o.id = io.orden_id
      WHERE o.estado IN ('pagado','procesando','enviado','entregado')
      GROUP BY p.id, p.nombre
      ORDER BY cantidad DESC
      LIMIT 10
    `);

    // Conteos simples.
    const [clientesRegistrados, productosActivos, todosProductos] =
      await Promise.all([
        this.prisma.usuarios.count({ where: { rol: 'cliente' } }),
        this.prisma.productos.count({ where: { esta_activo: true } }),
        this.catalogo.listarProductos(),
      ]);
    const alertasStock = todosProductos.filter(
      (p) => p.stockTotal <= p.umbralStock,
    ).length;

    return {
      ventasTotales,
      numeroOrdenes,
      ticketPromedio,
      clientesRegistrados,
      productosActivos,
      alertasStock,
      ingresosPorMes,
      ventasPorMetodoPago,
      productosMasVendidos: masVendidos.map((m) => ({
        producto: { id: m.id, nombre: m.nombre },
        cantidad: m.cantidad,
      })),
    };
  }
}
