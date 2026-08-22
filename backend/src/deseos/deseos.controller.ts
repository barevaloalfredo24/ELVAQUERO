// =====================================================================
// CONTROLADOR DE LISTA DE DESEOS
// ---------------------------------------------------------------------
// Endpoints protegidos para la wishlist del usuario autenticado.
// =====================================================================

import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { RequestConUsuario } from '../auth/auth.guard';
import { DeseosService } from './deseos.service';
import { ProductoDTO } from '../catalogo/catalogo.service';

@Controller('deseos')
@UseGuards(AuthGuard)
export class DeseosController {
  constructor(private readonly deseos: DeseosService) {}

  // GET /api/deseos  (productos guardados)
  @Get()
  listar(@Req() req: RequestConUsuario): Promise<ProductoDTO[]> {
    return this.deseos.listar(req.usuarioId ?? '');
  }

  // GET /api/deseos/ids  (solo los ids, para marcar botones)
  @Get('ids')
  ids(@Req() req: RequestConUsuario): Promise<string[]> {
    return this.deseos.ids(req.usuarioId ?? '');
  }

  // POST /api/deseos/:productoId
  @Post(':productoId')
  agregar(
    @Req() req: RequestConUsuario,
    @Param('productoId') productoId: string,
  ) {
    return this.deseos.agregar(req.usuarioId ?? '', productoId);
  }

  // DELETE /api/deseos/:productoId
  @Delete(':productoId')
  quitar(
    @Req() req: RequestConUsuario,
    @Param('productoId') productoId: string,
  ) {
    return this.deseos.quitar(req.usuarioId ?? '', productoId);
  }
}
