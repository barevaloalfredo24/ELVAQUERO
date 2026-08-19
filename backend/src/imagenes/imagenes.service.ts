// =====================================================================
// SERVICIO DE IMÁGENES (Cloudinary)
// ---------------------------------------------------------------------
// Sube imágenes de producto a Cloudinary (entrega optimizada vía CDN) y
// guarda la URL en la tabla imagenes_producto. También las elimina.
// =====================================================================

import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { PrismaService } from '../prisma/prisma.service';

// Extrae el public_id de una URL de Cloudinary para poder eliminarla.
// Ej: .../image/upload/v123/elvaquero/productos/abc.jpg -> elvaquero/productos/abc
function extraerPublicId(url: string): string | null {
  try {
    const u = new URL(url);
    const partes = u.pathname.split('/');
    const idx = partes.indexOf('upload');
    if (idx === -1) return null;
    const resto = partes.slice(idx + 1).filter((p) => !/^v\d+$/.test(p));
    const unido = resto.join('/');
    const punto = unido.lastIndexOf('.');
    return punto > 0 ? unido.slice(0, punto) : unido;
  } catch {
    return null;
  }
}

@Injectable()
export class ImagenesService {
  constructor(
    private prisma: PrismaService,
    config: ConfigService,
  ) {
    // Configura el SDK de Cloudinary con las credenciales de entorno.
    cloudinary.config({
      cloud_name: config.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: config.get<string>('CLOUDINARY_API_KEY'),
      api_secret: config.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  // Sube una imagen (buffer) a Cloudinary y la asocia al producto.
  async subirImagen(
    productoId: string,
    buffer: Buffer,
  ): Promise<{ id: string; url: string; posicion: number }> {
    const producto = await this.prisma.productos.findUnique({
      where: { id: productoId },
    });
    if (!producto) throw new NotFoundException('Producto no encontrado.');

    // Sube el buffer a Cloudinary usando un stream.
    const resultado = await new Promise<UploadApiResponse>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'elvaquero/productos' },
          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(new Error('No se pudo subir la imagen.'));
            }
          },
        );
        stream.end(buffer);
      },
    );

    // Posición: siguiente al número de imágenes actuales del producto.
    const posicion = await this.prisma.imagenes_producto.count({
      where: { producto_id: productoId },
    });

    const imagen = await this.prisma.imagenes_producto.create({
      data: { producto_id: productoId, url: resultado.secure_url, posicion },
    });

    return { id: imagen.id, url: imagen.url, posicion: imagen.posicion };
  }

  // Elimina una imagen de la base y (best-effort) de Cloudinary.
  async eliminarImagen(id: string): Promise<{ id: string }> {
    const imagen = await this.prisma.imagenes_producto.findUnique({
      where: { id },
    });
    if (!imagen) throw new NotFoundException('Imagen no encontrada.');

    const publicId = extraerPublicId(imagen.url);
    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch {
        // Si falla el borrado en Cloudinary, se ignora (la fila se borra igual).
      }
    }

    await this.prisma.imagenes_producto.delete({ where: { id } });
    return { id };
  }
}
