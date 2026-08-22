// =====================================================================
// SERVICIO DE RESEÑAS (calificaciones de 1 a 5 estrellas)
// ---------------------------------------------------------------------
// Permite a los clientes calificar un producto y dejar un comentario.
// Un usuario puede reseñar cada producto una sola vez (UNIQUE en BD);
// si vuelve a enviar una reseña, se actualiza la existente.
// =====================================================================

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ResenaDTO {
  id: string;
  usuarioId: string;
  nombreUsuario: string;
  calificacion: number;
  comentario: string | null;
  fechaCreacion: string;
}

@Injectable()
export class ResenasService {
  constructor(private prisma: PrismaService) {}

  // Lista las reseñas aprobadas de un producto (más recientes primero).
  async listarPorProducto(productoId: string): Promise<ResenaDTO[]> {
    const resenas = await this.prisma.resenas.findMany({
      where: { producto_id: productoId, esta_aprobada: true },
      orderBy: { fecha_creacion: 'desc' },
      include: { usuarios: true },
    });

    return resenas.map((r) => ({
      id: r.id,
      usuarioId: r.usuario_id,
      nombreUsuario: r.usuarios?.nombre_completo ?? 'Cliente',
      calificacion: r.calificacion,
      comentario: r.comentario,
      fechaCreacion: r.fecha_creacion.toISOString(),
    }));
  }

  // Crea o actualiza la reseña del usuario sobre un producto.
  async crear(
    usuarioId: string,
    productoId: string,
    calificacion: number,
    comentario?: string,
  ): Promise<ResenaDTO> {
    const producto = await this.prisma.productos.findUnique({
      where: { id: productoId },
    });
    if (!producto) throw new NotFoundException('Producto no encontrado.');

    // Upsert sobre la clave única (producto_id, usuario_id).
    const resena = await this.prisma.resenas.upsert({
      where: {
        producto_id_usuario_id: {
          producto_id: productoId,
          usuario_id: usuarioId,
        },
      },
      create: {
        producto_id: productoId,
        usuario_id: usuarioId,
        calificacion,
        comentario: comentario?.trim() || null,
        esta_aprobada: true,
      },
      update: {
        calificacion,
        comentario: comentario?.trim() || null,
        esta_aprobada: true,
      },
      include: { usuarios: true },
    });

    return {
      id: resena.id,
      usuarioId: resena.usuario_id,
      nombreUsuario: resena.usuarios?.nombre_completo ?? 'Cliente',
      calificacion: resena.calificacion,
      comentario: resena.comentario,
      fechaCreacion: resena.fecha_creacion.toISOString(),
    };
  }
}
