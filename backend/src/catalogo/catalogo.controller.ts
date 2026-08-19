// =====================================================================
// CONTROLADOR DE CATÁLOGO
// ---------------------------------------------------------------------
// Expone los endpoints REST del catálogo (bajo el prefijo global /api).
// =====================================================================

import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CatalogoService, CategoriaDTO, ProductoDTO } from './catalogo.service';

@Controller('catalogo')
export class CatalogoController {
  constructor(private readonly catalogo: CatalogoService) {}

  // GET /api/catalogo/categorias
  @Get('categorias')
  listarCategorias(): Promise<CategoriaDTO[]> {
    return this.catalogo.listarCategorias();
  }

  // GET /api/catalogo/cupones  (cupones activos para mostrar al cliente)
  @Get('cupones')
  listarCuponesActivos() {
    return this.catalogo.listarCuponesActivos();
  }

  // POST /api/catalogo/cupones/validar  (valida un cupón para el checkout)
  @Post('cupones/validar')
  validarCupon(@Body() body: { codigo?: string; subtotal?: number }) {
    return this.catalogo.validarCupon(
      body.codigo ?? '',
      Number(body.subtotal) || 0,
    );
  }

  // GET /api/catalogo/buscar?q=  (búsqueda difusa / autocompletado)
  @Get('buscar')
  buscar(@Query('q') q?: string): Promise<ProductoDTO[]> {
    return this.catalogo.buscarProductos(q ?? '');
  }

  // GET /api/catalogo/productos?categoria=&busqueda=&orden=
  @Get('productos')
  listarProductos(
    @Query('categoria') categoria?: string,
    @Query('busqueda') busqueda?: string,
    @Query('orden') orden?: string,
  ): Promise<ProductoDTO[]> {
    return this.catalogo.listarProductos({ categoria, busqueda, orden });
  }

  // GET /api/catalogo/productos/novedades
  @Get('productos/novedades')
  listarNovedades(): Promise<ProductoDTO[]> {
    return this.catalogo.listarNovedades();
  }

  // GET /api/catalogo/productos/slug/:slug
  @Get('productos/slug/:slug')
  obtenerPorSlug(@Param('slug') slug: string): Promise<ProductoDTO | null> {
    return this.catalogo.obtenerProductoPorSlug(slug);
  }

  // GET /api/catalogo/productos/:id
  @Get('productos/:id')
  obtenerPorId(@Param('id') id: string): Promise<ProductoDTO | null> {
    return this.catalogo.obtenerProductoPorId(id);
  }

  // GET /api/catalogo/productos/:id/relacionados
  @Get('productos/:id/relacionados')
  listarRelacionados(@Param('id') id: string): Promise<ProductoDTO[]> {
    return this.catalogo
      .obtenerProductoPorId(id)
      .then((p) =>
        p
          ? this.catalogo.listarRelacionados(p.categoriaId, p.id)
          : Promise.resolve([]),
      );
  }
}
