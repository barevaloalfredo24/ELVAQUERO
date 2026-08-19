// =====================================================================
// CONTROLADOR DE CATEGORÍAS (solo administrador)
// ---------------------------------------------------------------------
// CRUD de categorías bajo /api/admin/categorias.
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
import { ActualizarCategoriaDto, CrearCategoriaDto } from './dto';
import { CategoriasGestionService } from './categorias.service';

@Controller('admin/categorias')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
export class CategoriasGestionController {
  constructor(private readonly categorias: CategoriasGestionService) {}

  // POST /api/admin/categorias
  @Post()
  crear(@Body() dto: CrearCategoriaDto) {
    return this.categorias.crearCategoria(dto);
  }

  // PATCH /api/admin/categorias/:id
  @Patch(':id')
  actualizar(@Param('id') id: string, @Body() dto: ActualizarCategoriaDto) {
    return this.categorias.actualizarCategoria(id, dto);
  }

  // DELETE /api/admin/categorias/:id
  @Delete(':id')
  eliminar(@Param('id') id: string) {
    return this.categorias.eliminarCategoria(id);
  }
}
