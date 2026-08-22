// =====================================================================
// SERVICIO DE LISTA DE DESEOS (wishlist)
// ---------------------------------------------------------------------
// Permite a los usuarios registrados guardar productos sin comprarlos.
// Usa la tabla listas_deseos (UNIQUE usuario_id + producto_id).
// =====================================================================

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CatalogoService, ProductoDTO } from '../catalogo/catalogo.service';

@Injectable()
export class DeseosService {
  constructor(
    private prisma: PrismaService,
    private catalogo: CatalogoService,
  ) {}

  // Lista los productos en la wishlist del usuario.
  async listar(usuarioId: string): Promise<ProductoDTO[]> {
    const deseos = await this.prisma.listas_deseos.findMany({
      where: { usuario_id: usuarioId },
      orderBy: { fecha_agregado: 'desc' },
    });
    const ids = deseos.map((d) => d.producto_id);
    return this.catalogo.obtenerProductosPorIds(ids);
  }

  // Agrega un producto a la wishlist (idempotente).
  async agregar(
    usuarioId: string,
    productoId: string,
  ): Promise<{ ok: boolean }> {
    const producto = await this.prisma.productos.findUnique({
      where: { id: productoId },
    });
    if (!producto) throw new NotFoundException('Producto no encontrado.');

    await this.prisma.listas_deseos.upsert({
      where: {
        usuario_id_producto_id: {
          usuario_id: usuarioId,
          producto_id: productoId,
        },
      },
      create: { usuario_id: usuarioId, producto_id: productoId },
      update: {},
    });
    return { ok: true };
  }

  // Quita un producto de la wishlist.
  async quitar(
    usuarioId: string,
    productoId: string,
  ): Promise<{ ok: boolean }> {
    await this.prisma.listas_deseos.deleteMany({
      where: { usuario_id: usuarioId, producto_id: productoId },
    });
    return { ok: true };
  }

  // Devuelve los ids de los productos en la wishlist del usuario.
  async ids(usuarioId: string): Promise<string[]> {
    const deseos = await this.prisma.listas_deseos.findMany({
      where: { usuario_id: usuarioId },
      select: { producto_id: true },
    });
    return deseos.map((d) => d.producto_id);
  }
}
