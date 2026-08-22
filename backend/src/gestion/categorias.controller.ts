// =====================================================================
// CONTROLADOR DE CATEGORÍAS (solo administrador)
// ---------------------------------------------------------------------
// CRUD de categorías bajo /api/admin/categorias.
// =====================================================================

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ActualizarCategoriaDto, CrearCategoriaDto } from './dto';
import { CategoriasGestionService } from './categorias.service';
import { ImagenesService } from '../imagenes/imagenes.service';

@Controller('admin/categorias')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
export class CategoriasGestionController {
  constructor(
    private readonly categorias: CategoriasGestionService,
    private readonly imagenes: ImagenesService,
  ) {}

  // POST /api/admin/categorias
  @Post()
  crear(@Body() dto: CrearCategoriaDto) {
    return this.categorias.crearCategoria(dto);
  }

  // POST /api/admin/categorias/imagen  (sube imagen a Cloudinary y devuelve URL)
  @Post('imagen')
  @UseInterceptors(
    FileInterceptor('imagen', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  subirImagen(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se envió ninguna imagen.');
    return this.imagenes.subirImagenCategoria(file.buffer);
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
