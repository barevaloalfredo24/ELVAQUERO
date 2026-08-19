// =====================================================================
// SERVICIO DE PRODUCTOS (GESTIÓN)
// ---------------------------------------------------------------------
// CRUD de productos para administradores y staff. Las variantes se
// crean/editan junto con el producto. El "borrado" es lógico (esta_activo
// = false) para no romper órdenes que referencien a esas variantes.
// =====================================================================

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ActualizarProductoDto, CrearProductoDto, VarianteDto } from './dto';

@Injectable()
export class ProductosGestionService {
  constructor(private prisma: PrismaService) {}

  // Genera un SKU único (slug + talla + color + sufijo aleatorio).
  private generarSku(slug: string, talla: string, color: string): string {
    const base = `${slug}-${talla}-${color}`
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 70);
    return `${base}-${randomUUID().slice(0, 6).toUpperCase()}`;
  }

  // Datos base de una variante (sin producto_id; se añade donde haga falta).
  private datosVariante(slug: string, precioBase: number, v: VarianteDto) {
    return {
      sku: this.generarSku(slug, v.talla, v.color),
      atributos: { talla: v.talla, color: v.color },
      precio_alternativo:
        v.precio !== undefined && v.precio !== precioBase ? v.precio : null,
      cantidad_stock: v.stock,
      umbral_stock_bajo: 5,
      esta_activo: true,
    };
  }

  // Crea un producto con sus variantes.
  async crearProducto(dto: CrearProductoDto): Promise<{ id: string }> {
    const slug = dto.slug.trim().toLowerCase();
    const existente = await this.prisma.productos.findUnique({
      where: { slug },
    });
    if (existente)
      throw new ConflictException('Ya existe un producto con ese slug.');

    const id = randomUUID();
    await this.prisma.productos.create({
      data: {
        id,
        nombre: dto.nombre.trim(),
        slug,
        descripcion: dto.descripcion ?? null,
        categoria_id: dto.categoriaId ?? null,
        precio_base: dto.precioBase,
        esta_activo: dto.estaActivo ?? true,
        variantes_producto: {
          create: dto.variantes.map((v) =>
            this.datosVariante(slug, dto.precioBase, v),
          ),
        },
      },
    });

    return { id };
  }

  // Actualiza un producto. Si se envían variantes, se reemplazan.
  async actualizarProducto(
    id: string,
    dto: ActualizarProductoDto,
  ): Promise<{ id: string }> {
    const producto = await this.prisma.productos.findUnique({ where: { id } });
    if (!producto) throw new NotFoundException('Producto no encontrado.');

    const data: Record<string, unknown> = {};
    if (dto.nombre !== undefined) data.nombre = dto.nombre.trim();
    if (dto.descripcion !== undefined) data.descripcion = dto.descripcion;
    if (dto.categoriaId !== undefined) data.categoria_id = dto.categoriaId;
    if (dto.precioBase !== undefined) data.precio_base = dto.precioBase;
    if (dto.estaActivo !== undefined) data.esta_activo = dto.estaActivo;

    if (dto.slug !== undefined) {
      const slug = dto.slug.trim().toLowerCase();
      if (slug !== producto.slug) {
        const existente = await this.prisma.productos.findUnique({
          where: { slug },
        });
        if (existente)
          throw new ConflictException('Ya existe un producto con ese slug.');
      }
      data.slug = slug;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.productos.update({ where: { id }, data });

      // Si vienen variantes nuevas, desactiva las actuales y crea las nuevas.
      if (dto.variantes && dto.variantes.length > 0) {
        const precioBase = (dto.precioBase ?? producto.precio_base) as number;
        await tx.variantes_producto.updateMany({
          where: { producto_id: id, esta_activo: true },
          data: { esta_activo: false },
        });
        await tx.variantes_producto.createMany({
          data: dto.variantes.map((v) => ({
            ...this.datosVariante(producto.slug, precioBase, v),
            producto_id: id,
          })),
        });
      }
    });

    return { id };
  }

  // Desactiva un producto (borrado lógico) y sus variantes.
  async desactivarProducto(id: string): Promise<{ id: string }> {
    const producto = await this.prisma.productos.findUnique({ where: { id } });
    if (!producto) throw new NotFoundException('Producto no encontrado.');

    await this.prisma.$transaction([
      this.prisma.productos.update({
        where: { id },
        data: { esta_activo: false },
      }),
      this.prisma.variantes_producto.updateMany({
        where: { producto_id: id, esta_activo: true },
        data: { esta_activo: false },
      }),
    ]);

    return { id };
  }
}
