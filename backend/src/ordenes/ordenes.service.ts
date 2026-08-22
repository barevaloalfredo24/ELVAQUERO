// =====================================================================
// SERVICIO DE ÓRDENES
// ---------------------------------------------------------------------
// Crea órdenes validando stock en la base de datos (evita sobreventa),
// calcula totales y descuenta inventario en una transacción. También
// lista las órdenes del usuario autenticado.
// =====================================================================

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { mapearEstado, mapearEstadoPago } from '../common/mapeos';
import { calcularDescuento, validarCupon } from '../common/cupones';
import { esDepartamentoValido } from '../common/departamentos';
import { CrearOrdenDto } from './dto';

export interface LineaOrdenDTO {
  productoId: string;
  nombre: string;
  variante: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface OrdenDTO {
  id: string;
  clienteId: string;
  clienteNombre: string;
  clienteEmail: string;
  items: LineaOrdenDTO[];
  subtotal: number;
  descuento: number;
  envio: number;
  total: number;
  metodoPago: string;
  estado: string;
  estadoPago: string;
  numeroSeguimiento: string | null;
  paqueteria: string | null;
  direccionEnvio: string;
  departamento: string;
  telefono: string;
  fecha: string;
}

// Costos de envío (igual que el frontend).
const ENVIO = 45;
const UMBRAL_ENVIO_GRATIS = 500;

// Tipo de una orden de Prisma con todo lo necesario para mapearla.
type OrdenConDetalle = Prisma.ordenesGetPayload<{
  include: {
    items_orden: {
      include: {
        variantes_producto: { select: { producto_id: true; atributos: true } };
      };
    };
    usuarios: true;
    pagos: true;
    direcciones_ordenes_direccion_envio_idTodirecciones: true;
  };
}>;

@Injectable()
export class OrdenesService {
  constructor(private prisma: PrismaService) {}

  // Crea una orden a partir del carrito del cliente.
  async crearOrden(usuarioId: string, dto: CrearOrdenDto): Promise<OrdenDTO> {
    const usuario = await this.prisma.usuarios.findUnique({
      where: { id: usuarioId },
    });
    if (!usuario) throw new UnauthorizedException('Usuario no válido.');

    // El staff solo gestiona productos; no puede realizar pedidos.
    if (usuario.rol === 'staff') {
      throw new ForbiddenException(
        'Los usuarios de staff no pueden realizar pedidos.',
      );
    }

    // La cobertura de envío se limita a Guatemala y sus departamentos.
    if (!esDepartamentoValido(dto.departamento)) {
      throw new BadRequestException(
        'La cobertura de envío es únicamente dentro de la República de Guatemala.',
      );
    }

    // Carga cada variante con su producto para validar stock y precios.
    const variantes = await Promise.all(
      dto.items.map((it) =>
        this.prisma.variantes_producto.findUnique({
          where: { id: it.varianteId },
          include: { productos: true },
        }),
      ),
    );

    // Valida existencia y stock, y arma las líneas con precio real de la BD.
    const lineas: {
      varianteId: string;
      productoId: string;
      nombre: string;
      variante: string;
      sku: string;
      cantidad: number;
      precioUnitario: number;
      subtotal: number;
    }[] = [];

    dto.items.forEach((it, i) => {
      const v = variantes[i];
      if (!v)
        throw new BadRequestException(
          `Variante no encontrada: ${it.varianteId}`,
        );
      if (v.cantidad_stock < it.cantidad) {
        throw new BadRequestException(
          `Stock insuficiente para "${v.productos.nombre}".`,
        );
      }
      const at = (v.atributos ?? {}) as { talla?: string; color?: string };
      const precio = v.precio_alternativo
        ? Number(v.precio_alternativo)
        : Number(v.productos.precio_base);
      lineas.push({
        varianteId: v.id,
        productoId: v.producto_id,
        nombre: v.productos.nombre,
        variante: `Talla ${at.talla ?? ''} · ${at.color ?? ''}`,
        sku: v.sku,
        cantidad: it.cantidad,
        precioUnitario: precio,
        subtotal: precio * it.cantidad,
      });
    });

    const subtotal = lineas.reduce((acc, l) => acc + l.subtotal, 0);
    const envio = subtotal >= UMBRAL_ENVIO_GRATIS ? 0 : ENVIO;

    // Aplica el cupón si se envió (valida requisitos y calcula descuento).
    let cuponId: string | null = null;
    let descuento = 0;
    if (dto.cuponCodigo) {
      const cupon = await this.prisma.cupones.findUnique({
        where: { codigo: dto.cuponCodigo.trim().toUpperCase() },
      });
      if (!cupon) throw new BadRequestException('Cupón no encontrado.');
      const reglas = validarCupon(cupon, subtotal);
      if (!reglas.valido) throw new BadRequestException(reglas.mensaje);
      cuponId = cupon.id;
      descuento = calcularDescuento(cupon, subtotal);
    }

    const total = subtotal - descuento + envio;
    const numero = `ORD-${Date.now()}`;

    // Transacción: crea dirección, orden, ítems y pago; descuenta stock.
    const orden = await this.prisma.$transaction(async (tx) => {
      // Guarda la dirección de envío (calle + departamento).
      const direccion = await tx.direcciones.create({
        data: {
          usuario_id: usuarioId,
          calle: dto.direccionEnvio,
          ciudad: 'Guatemala',
          provincia: dto.departamento.trim(),
          pais: 'Guatemala',
        },
      });

      const creada = await tx.ordenes.create({
        data: {
          numero_orden: numero,
          usuario_id: usuarioId,
          estado: 'pendiente',
          metodo_pago: dto.metodoPago,
          direccion_envio_id: direccion.id,
          cupon_id: cuponId,
          subtotal,
          descuento_total: descuento,
          envio_total: envio,
          impuestos_total: 0,
          total,
          items_orden: {
            create: lineas.map((l) => ({
              variante_id: l.varianteId,
              nombre_producto_snapshot: l.nombre,
              sku_snapshot: l.sku,
              precio_unitario: l.precioUnitario,
              cantidad: l.cantidad,
              subtotal: l.subtotal,
            })),
          },
          pagos: {
            create: {
              metodo: dto.metodoPago,
              estado: 'pendiente',
              monto: total,
            },
          },
        },
        include: { items_orden: true },
      });

      // Registra la redención del cupón y aumenta su contador de usos.
      if (cuponId) {
        await tx.cupones.update({
          where: { id: cuponId },
          data: { veces_usado: { increment: 1 } },
        });
        await tx.redenciones_cupon.create({
          data: {
            cupon_id: cuponId,
            usuario_id: usuarioId,
            orden_id: creada.id,
          },
        });
      }

      // Descuenta el stock de cada variante y dispara alerta si cruza umbral.
      for (const l of lineas) {
        await tx.variantes_producto.update({
          where: { id: l.varianteId },
          data: { cantidad_stock: { decrement: l.cantidad } },
        });
        const v = await tx.variantes_producto.findUnique({
          where: { id: l.varianteId },
        });
        if (v && v.cantidad_stock <= v.umbral_stock_bajo) {
          await tx.alertas_stock.create({
            data: {
              variante_id: v.id,
              umbral_al_disparar: v.umbral_stock_bajo,
              stock_al_disparar: v.cantidad_stock,
            },
          });
        }
      }

      return creada;
    });

    // Guarda el teléfono del usuario si aún no lo tiene.
    if (!usuario.telefono) {
      await this.prisma.usuarios.update({
        where: { id: usuarioId },
        data: { telefono: dto.telefono },
      });
    }

    return {
      id: orden.numero_orden,
      clienteId: usuarioId,
      clienteNombre: usuario.nombre_completo,
      clienteEmail: usuario.correo,
      items: lineas.map((l) => ({
        productoId: l.productoId,
        nombre: l.nombre,
        variante: l.variante,
        cantidad: l.cantidad,
        precioUnitario: l.precioUnitario,
        subtotal: l.subtotal,
      })),
      subtotal,
      descuento,
      envio,
      total,
      metodoPago: dto.metodoPago,
      estado: mapearEstado('pendiente', dto.metodoPago),
      estadoPago: 'pendiente',
      numeroSeguimiento: null,
      paqueteria: null,
      direccionEnvio: dto.direccionEnvio,
      departamento: dto.departamento.trim(),
      telefono: dto.telefono,
      fecha: orden.fecha_creacion.toISOString(),
    };
  }

  // Mapea una orden de Prisma al DTO del frontend.
  private aOrdenDTO(o: OrdenConDetalle): OrdenDTO {
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
      estadoPago: mapearEstadoPago(o.pagos[0]?.estado),
      numeroSeguimiento: o.numero_seguimiento,
      paqueteria: o.paqueteria,
      direccionEnvio: direccion ? direccion.calle : '',
      departamento: direccion?.provincia ?? '',
      telefono: o.usuarios.telefono ?? '',
      fecha: o.fecha_creacion.toISOString(),
    };
  }

  // Lista las órdenes del usuario autenticado.
  async listarMisOrdenes(usuarioId: string): Promise<OrdenDTO[]> {
    const ordenes = await this.prisma.ordenes.findMany({
      where: { usuario_id: usuarioId },
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
        pagos: true,
        direcciones_ordenes_direccion_envio_idTodirecciones: true,
      },
    });
    return ordenes.map((o) => this.aOrdenDTO(o));
  }
}
