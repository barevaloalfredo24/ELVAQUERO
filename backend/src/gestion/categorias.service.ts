// =====================================================================
// SERVICIO DE CATEGORÍAS (GESTIÓN)
// ---------------------------------------------------------------------
// CRUD de categorías para el administrador. El borrado es físico; gracias
// a las restricciones ON DELETE SET NULL, los productos quedan "sin
// categoría" si se elimina una categoría.
// =====================================================================

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActualizarCategoriaDto, CrearCategoriaDto } from './dto';

// Genera un slug a partir de un texto (minúsculas, sin acentos, guiones).
function slugificar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Injectable()
export class CategoriasGestionService {
  constructor(private prisma: PrismaService) {}

  // Crea una categoría.
  async crearCategoria(dto: CrearCategoriaDto) {
    const slug = (dto.slug?.trim() || slugificar(dto.nombre)).toLowerCase();
    const existente = await this.prisma.categorias.findUnique({
      where: { slug },
    });
    if (existente)
      throw new ConflictException('Ya existe una categoría con ese slug.');

    return this.prisma.categorias.create({
      data: {
        nombre: dto.nombre.trim(),
        slug,
        categoria_padre_id: dto.categoriaPadreId || null,
        imagen: dto.imagen?.trim() || null,
        alt: dto.alt?.trim() || dto.nombre.trim(),
      },
      select: { id: true, nombre: true, slug: true, imagen: true, alt: true },
    });
  }

  // Actualiza una categoría.
  async actualizarCategoria(id: string, dto: ActualizarCategoriaDto) {
    const categoria = await this.prisma.categorias.findUnique({
      where: { id },
    });
    if (!categoria) throw new NotFoundException('Categoría no encontrada.');

    const data: Record<string, unknown> = {};
    if (dto.nombre !== undefined) data.nombre = dto.nombre.trim();
    if (dto.categoriaPadreId !== undefined) {
      data.categoria_padre_id = dto.categoriaPadreId || null;
    }
    if (dto.imagen !== undefined) data.imagen = dto.imagen.trim() || null;
    if (dto.alt !== undefined) data.alt = dto.alt.trim() || null;

    if (dto.slug !== undefined) {
      const slug = dto.slug.trim().toLowerCase();
      if (slug !== categoria.slug) {
        const existente = await this.prisma.categorias.findUnique({
          where: { slug },
        });
        if (existente)
          throw new ConflictException('Ya existe una categoría con ese slug.');
      }
      data.slug = slug;
    }

    return this.prisma.categorias.update({
      where: { id },
      data,
      select: { id: true, nombre: true, slug: true, imagen: true, alt: true },
    });
  }

  // Elimina una categoría (los productos quedan sin categoría).
  async eliminarCategoria(id: string): Promise<{ id: string }> {
    const categoria = await this.prisma.categorias.findUnique({
      where: { id },
    });
    if (!categoria) throw new NotFoundException('Categoría no encontrada.');

    await this.prisma.categorias.delete({ where: { id } });
    return { id };
  }
}
