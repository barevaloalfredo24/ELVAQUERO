// =====================================================================
// CONTROLADOR DE RESEÑAS
// ---------------------------------------------------------------------
// GET  /api/resenas/producto/:productoId  -> lista reseñas aprobadas
// POST /api/resenas/producto/:productoId  -> crea/actualiza la reseña
// =====================================================================

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { RequestConUsuario } from '../auth/auth.guard';
import { ResenasService, ResenaDTO } from './resenas.service';
import { CrearResenaDto } from './dto';

@Controller('resenas')
export class ResenasController {
  constructor(private readonly resenas: ResenasService) {}

  // GET /api/resenas/producto/:productoId
  @Get('producto/:productoId')
  listar(@Param('productoId') productoId: string): Promise<ResenaDTO[]> {
    return this.resenas.listarPorProducto(productoId);
  }

  // POST /api/resenas/producto/:productoId
  @Post('producto/:productoId')
  @UseGuards(AuthGuard)
  crear(
    @Req() req: RequestConUsuario,
    @Param('productoId') productoId: string,
    @Body() dto: CrearResenaDto,
  ): Promise<ResenaDTO> {
    return this.resenas.crear(
      req.usuarioId ?? '',
      productoId,
      dto.calificacion,
      dto.comentario,
    );
  }
}
