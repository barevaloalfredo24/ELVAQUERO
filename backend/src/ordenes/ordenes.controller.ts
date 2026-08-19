// =====================================================================
// CONTROLADOR DE ÓRDENES
// ---------------------------------------------------------------------
// Endpoints protegidos para crear y listar órdenes del usuario actual.
// =====================================================================

import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { RequestConUsuario } from '../auth/auth.guard';
import { CrearOrdenDto } from './dto';
import { OrdenDTO, OrdenesService } from './ordenes.service';

@Controller('ordenes')
@UseGuards(AuthGuard)
export class OrdenesController {
  constructor(private readonly ordenes: OrdenesService) {}

  // POST /api/ordenes
  @Post()
  crear(
    @Body() dto: CrearOrdenDto,
    @Req() req: RequestConUsuario,
  ): Promise<OrdenDTO> {
    return this.ordenes.crearOrden(req.usuarioId ?? '', dto);
  }

  // GET /api/ordenes/mis
  @Get('mis')
  listarMis(@Req() req: RequestConUsuario): Promise<OrdenDTO[]> {
    return this.ordenes.listarMisOrdenes(req.usuarioId ?? '');
  }
}
