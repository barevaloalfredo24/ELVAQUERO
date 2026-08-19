// =====================================================================
// CONTROLADOR DE IMÁGENES (admin + staff)
// ---------------------------------------------------------------------
// Subida (multipart) y eliminación de imágenes de producto.
// =====================================================================

import {
  BadRequestException,
  Controller,
  Delete,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ImagenesService } from './imagenes.service';

@Controller('admin/productos')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin', 'staff')
export class ImagenesController {
  constructor(private readonly imagenes: ImagenesService) {}

  // POST /api/admin/productos/:id/imagenes  (multipart, campo "imagen")
  @Post(':id/imagenes')
  @UseInterceptors(
    FileInterceptor('imagen', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  subir(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se envió ninguna imagen.');
    return this.imagenes.subirImagen(id, file.buffer);
  }

  // DELETE /api/admin/productos/imagenes/:imagenId
  @Delete('imagenes/:imagenId')
  eliminar(@Param('imagenId') imagenId: string) {
    return this.imagenes.eliminarImagen(imagenId);
  }
}
