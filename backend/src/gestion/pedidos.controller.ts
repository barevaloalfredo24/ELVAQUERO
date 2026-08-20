// =====================================================================
// CONTROLADOR DE PEDIDOS (GESTIÓN)
// ---------------------------------------------------------------------
// Endpoints de administración de pedidos (seguimiento), para admin y staff.
// =====================================================================

import { Body, Controller, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import type { RequestConUsuario } from '../auth/auth.guard';
import { AsignarSeguimientoDto } from './dto';
import { PedidosGestionService } from './pedidos.service';

@Controller('admin/pedidos')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin', 'staff')
export class PedidosGestionController {
  constructor(private readonly pedidos: PedidosGestionService) {}

  // PATCH /api/admin/pedidos/:id/seguimiento
  @Patch(':id/seguimiento')
  asignarSeguimiento(
    @Param('id') id: string,
    @Body() dto: AsignarSeguimientoDto,
    @Req() req: RequestConUsuario,
  ) {
    return this.pedidos.asignarSeguimiento(id, dto, req.usuarioId ?? '');
  }
}
