// =====================================================================
// SERVICIO DE CATÁLOGO (contra el esquema real de PostgreSQL/Supabase)
// ---------------------------------------------------------------------
// Consulta productos/categorías vía Prisma y mapea el resultado a la
// forma que espera el frontend (camelCase, talla/color planos, etc.).
// =====================================================================

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  calcularDescuento,
  validarCupon as validarCuponReglas,
} from '../common/cupones';

// --- Formas de salida (coinciden con src/lib/tipos.ts del frontend) ---

export interface VarianteDTO {
  id: string;
  talla: string;
  color: string;
  stock: number;
  precio: number;
}

export interface ImagenDTO {
  id: string;
  url: string;
  posicion: number;
}

export interface ProductoDTO {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string;
  categoriaId: string;
  categoriaSlug: string;
  categoriaNombre: string;
  precio: number;
  precioAnterior?: number;
  moneda: string;
  imagenes: ImagenDTO[];
  variantes: VarianteDTO[];
  destacado: boolean;
  enOferta: boolean;
  calificacion: number;
  numResenas: number;
  stockTotal: number;
  umbralStock: number;
  disponible: boolean;
}

export interface CategoriaDTO {
  id: string;
  nombre: string;
  slug: string;
  imagen?: string | null;
  alt?: string | null;
}

export interface FiltrosCatalogo {
  categoria?: string;
  busqueda?: string;
  orden?: string;
  soloOferta?: boolean;
}

// Producto de Prisma incluyendo categoría, variantes, imágenes y reseñas.
type ProductoConDetalle = Prisma.productosGetPayload<{
  include: {
    categorias: true;
    variantes_producto: { where: { esta_activo: true } };
    imagenes_producto: { orderBy: { posicion: 'asc' } };
    resenas: { where: { esta_aprobada: true } };
  };
}>;

@Injectable()
export class CatalogoService {
  constructor(private prisma: PrismaService) {}

  // Convierte Decimal (Prisma) a number.
  private n(x: Prisma.Decimal | number | null | undefined): number {
    return Number(x ?? 0);
  }

  // Mapea un producto de Prisma al DTO del frontend.
  private aProductoDTO(p: ProductoConDetalle): ProductoDTO {
    const precioBase = this.n(p.precio_base);

    // Convierte variantes: extrae talla/color del JSONB de atributos.
    const variantes: VarianteDTO[] = p.variantes_producto.map((v) => {
      const at = (v.atributos ?? {}) as { talla?: string; color?: string };
      return {
        id: v.id,
        talla: at.talla ?? '',
        color: at.color ?? '',
        stock: v.cantidad_stock,
        precio: v.precio_alternativo
          ? this.n(v.precio_alternativo)
          : precioBase,
      };
    });

    // Promedio de calificación a partir de las reseñas aprobadas.
    const totalResenas = p.resenas.length;
    const calificacion = totalResenas
      ? p.resenas.reduce((acc, r) => acc + r.calificacion, 0) / totalResenas
      : 0;

    const stockTotal = variantes.reduce((acc, v) => acc + v.stock, 0);
    const umbrales = p.variantes_producto.map((v) => v.umbral_stock_bajo);
    const umbralStock = umbrales.length ? Math.min(...umbrales) : 5;

    return {
      id: p.id,
      slug: p.slug,
      nombre: p.nombre,
      descripcion: p.descripcion ?? '',
      categoriaId: p.categoria_id ?? '',
      categoriaSlug: p.categorias?.slug ?? '',
      categoriaNombre: p.categorias?.nombre ?? '',
      precio: precioBase,
      precioAnterior: undefined, // El esquema no contempla precios de oferta
      moneda: 'GTQ',
      imagenes: p.imagenes_producto.map((i) => ({
        id: i.id,
        url: i.url,
        posicion: i.posicion,
      })),
      variantes,
      destacado: false,
      enOferta: false,
      calificacion: Math.round(calificacion * 10) / 10,
      numResenas: totalResenas,
      stockTotal,
      umbralStock,
      disponible: p.esta_activo && stockTotal > 0,
    };
  }

  // Lista todas las categorías.
  async listarCategorias(): Promise<CategoriaDTO[]> {
    return this.prisma.categorias.findMany({
      orderBy: { nombre: 'asc' },
      select: { id: true, nombre: true, slug: true, imagen: true, alt: true },
    });
  }

  // Mapea un cupón de Prisma al DTO del frontend.
  private aCuponDTO(c: {
    id: string;
    codigo: string;
    tipo_descuento: string;
    valor_descuento: unknown;
    monto_minimo_orden: unknown;
    limite_uso: number | null;
    veces_usado: number;
    fecha_inicio_validez: Date;
    fecha_fin_validez: Date;
    esta_activo: boolean;
  }) {
    return {
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
    };
  }

  // Lista los cupones activos y vigentes (para mostrar a los clientes).
  async listarCuponesActivos() {
    const ahora = new Date();
    const cupones = await this.prisma.cupones.findMany({
      where: {
        esta_activo: true,
        fecha_inicio_validez: { lte: ahora },
        fecha_fin_validez: { gte: ahora },
      },
      orderBy: { fecha_creacion: 'desc' },
    });

    // Filtra los que aún no alcanzaron su límite de usos (o son ilimitados).
    return cupones
      .filter((c) => c.limite_uso === null || c.veces_usado < c.limite_uso)
      .map((c) => this.aCuponDTO(c));
  }

  // Valida un cupón y calcula el descuento para un subtotal dado.
  async validarCupon(codigo: string, subtotal: number) {
    const cupon = await this.prisma.cupones.findUnique({
      where: { codigo: codigo.trim().toUpperCase() },
    });
    if (!cupon) return { valido: false, mensaje: 'Cupón no encontrado.' };

    const reglas = validarCuponReglas(cupon, subtotal);
    if (!reglas.valido) return { valido: false, mensaje: reglas.mensaje };

    return {
      valido: true,
      cupon: this.aCuponDTO(cupon),
      descuento: calcularDescuento(cupon, subtotal),
    };
  }

  // Lista productos aplicando filtros.
  async listarProductos(filtros: FiltrosCatalogo = {}): Promise<ProductoDTO[]> {
    // Si hay texto de búsqueda, se usa la búsqueda difusa (pg_trgm).
    if (filtros.busqueda) {
      return this.buscarProductos(filtros.busqueda, filtros.categoria);
    }

    const where: Prisma.productosWhereInput = { esta_activo: true };

    if (filtros.categoria) {
      where.categorias = { slug: filtros.categoria };
    }

    let orderBy: Prisma.productosOrderByWithRelationInput[] = [];
    switch (filtros.orden) {
      case 'precio-asc':
        orderBy = [{ precio_base: 'asc' }];
        break;
      case 'precio-desc':
        orderBy = [{ precio_base: 'desc' }];
        break;
      case 'nombre':
        orderBy = [{ nombre: 'asc' }];
        break;
      default:
        orderBy = [{ fecha_creacion: 'desc' }];
    }

    const productos = await this.prisma.productos.findMany({
      where,
      orderBy,
      include: {
        categorias: true,
        variantes_producto: { where: { esta_activo: true } },
        imagenes_producto: { orderBy: { posicion: 'asc' } },
        resenas: { where: { esta_aprobada: true } },
      },
    });

    return productos.map((p) => this.aProductoDTO(p));
  }

  // Obtiene varios productos por sus ids (para la lista de deseos).
  async obtenerProductosPorIds(ids: string[]): Promise<ProductoDTO[]> {
    if (ids.length === 0) return [];
    const productos = await this.prisma.productos.findMany({
      where: { id: { in: ids }, esta_activo: true },
      include: {
        categorias: true,
        variantes_producto: { where: { esta_activo: true } },
        imagenes_producto: { orderBy: { posicion: 'asc' } },
        resenas: { where: { esta_aprobada: true } },
      },
    });
    const mapa = new Map(productos.map((p) => [p.id, p]));
    // Conserva el orden de los ids recibidos.
    return ids
      .map((id) => mapa.get(id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .map((p) => this.aProductoDTO(p));
  }

  // Búsqueda difusa de productos: tolera errores ortográficos (pg_trgm)
  // y coincide con prefijos/subcadenas (autocompletado). Ordena por
  // relevancia: prefijo > subcadena > similitud trigram.
  async buscarProductos(
    query: string,
    categoriaSlug?: string,
  ): Promise<ProductoDTO[]> {
    const q = query.trim();
    if (!q) return [];

    // Filtro opcional por categoría (slug).
    const condCategoria = categoriaSlug
      ? Prisma.sql`AND p.categoria_id = (SELECT id FROM categorias WHERE slug = ${categoriaSlug})`
      : Prisma.empty;

    const filas = await this.prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
      SELECT p.id
      FROM productos p
      WHERE p.esta_activo = true
        ${condCategoria}
        AND (
          p.nombre ILIKE ${'%' + q + '%'}
          OR word_similarity(${q}, p.nombre) > 0.3
        )
      ORDER BY
        CASE
          WHEN p.nombre ILIKE ${q + '%'} THEN 0
          WHEN p.nombre ILIKE ${'%' + q + '%'} THEN 1
          ELSE 2
        END,
        word_similarity(${q}, p.nombre) DESC,
        p.nombre ASC
      LIMIT 20
    `);

    const ids = filas.map((f) => f.id);
    if (ids.length === 0) return [];

    const productos = await this.prisma.productos.findMany({
      where: { id: { in: ids } },
      include: {
        categorias: true,
        variantes_producto: { where: { esta_activo: true } },
        imagenes_producto: { orderBy: { posicion: 'asc' } },
        resenas: { where: { esta_aprobada: true } },
      },
    });

    // Conserva el orden de relevancia devuelto por la consulta.
    const mapa = new Map(productos.map((p) => [p.id, p]));
    return ids
      .map((id) => mapa.get(id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .map((p) => this.aProductoDTO(p));
  }

  // Productos más recientes (para la sección de "novedades").
  async listarNovedades(cantidad = 8): Promise<ProductoDTO[]> {
    const productos = await this.prisma.productos.findMany({
      where: { esta_activo: true },
      orderBy: { fecha_creacion: 'desc' },
      take: cantidad,
      include: {
        categorias: true,
        variantes_producto: { where: { esta_activo: true } },
        imagenes_producto: { orderBy: { posicion: 'asc' } },
        resenas: { where: { esta_aprobada: true } },
      },
    });
    return productos.map((p) => this.aProductoDTO(p));
  }

  // Obtiene un producto por id.
  async obtenerProductoPorId(id: string): Promise<ProductoDTO | null> {
    const p = await this.prisma.productos.findUnique({
      where: { id },
      include: {
        categorias: true,
        variantes_producto: { where: { esta_activo: true } },
        imagenes_producto: { orderBy: { posicion: 'asc' } },
        resenas: { where: { esta_aprobada: true } },
      },
    });
    return p ? this.aProductoDTO(p) : null;
  }

  // Obtiene un producto por slug.
  async obtenerProductoPorSlug(slug: string): Promise<ProductoDTO | null> {
    const p = await this.prisma.productos.findUnique({
      where: { slug },
      include: {
        categorias: true,
        variantes_producto: { where: { esta_activo: true } },
        imagenes_producto: { orderBy: { posicion: 'asc' } },
        resenas: { where: { esta_aprobada: true } },
      },
    });
    return p ? this.aProductoDTO(p) : null;
  }

  // Productos relacionados (misma categoría, excluyendo el actual).
  async listarRelacionados(
    categoriaId: string,
    excluirId: string,
  ): Promise<ProductoDTO[]> {
    const productos = await this.prisma.productos.findMany({
      where: {
        esta_activo: true,
        categoria_id: categoriaId,
        id: { not: excluirId },
      },
      take: 4,
      include: {
        categorias: true,
        variantes_producto: { where: { esta_activo: true } },
        imagenes_producto: { orderBy: { posicion: 'asc' } },
        resenas: { where: { esta_aprobada: true } },
      },
    });
    return productos.map((p) => this.aProductoDTO(p));
  }
}
