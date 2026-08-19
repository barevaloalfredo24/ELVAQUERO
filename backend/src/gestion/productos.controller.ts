// =====================================================================
// CONTROLADOR DE PRODUCTOS (GESTIÓN)
// ---------------------------------------------------------------------
// CRUD de productos accesible para administradores y staff.
// =====================================================================

import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ActualizarProductoDto, CrearProductoDto } from './dto';
import { ProductosGestionService } from './productos.service';

@Controller('admin/productos')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin', 'staff')
export class ProductosGestionController {
  constructor(private readonly productos: ProductosGestionService) {}

  // POST /api/admin/productos
  @Post()
  crear(@Body() dto: CrearProductoDto): Promise<{ id: string }> {
    return this.productos.crearProducto(dto);
  }

  // PATCH /api/admin/productos/:id
  @Patch(':id')
  actualizar(
    @Param('id') id: string,
    @Body() dto: ActualizarProductoDto,
  ): Promise<{ id: string }> {
    return this.productos.actualizarProducto(id, dto);
  }

  // DELETE /api/admin/productos/:id (desactiva el producto)
  @Delete(':id')
  desactivar(@Param('id') id: string): Promise<{ id: string }> {
    return this.productos.desactivarProducto(id);
  }
}
