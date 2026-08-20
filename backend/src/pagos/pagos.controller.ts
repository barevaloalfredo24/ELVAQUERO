// =====================================================================
// CONTROLADOR DE PAGOS (Recurrente)
// ---------------------------------------------------------------------
// Endpoints para crear el checkout embebido, confirmar el pago y recibir
// el webhook de Recurrente.
// =====================================================================

import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { RequestConUsuario } from '../auth/auth.guard';
import { CrearOrdenDto } from '../ordenes/dto';
import { PagosService } from './pagos.service';

@Controller()
export class PagosController {
  constructor(private readonly pagos: PagosService) {}

  // POST /api/pagos/recurrente/checkout  (protegido)
  @UseGuards(AuthGuard)
  @Post('pagos/recurrente/checkout')
  crearCheckout(@Body() dto: CrearOrdenDto, @Req() req: RequestConUsuario) {
    return this.pagos.crearCheckoutRecurrente(dto, req.usuarioId ?? '');
  }

  // POST /api/pagos/recurrente/confirmar  (protegido)
  @UseGuards(AuthGuard)
  @Post('pagos/recurrente/confirmar')
  confirmar(@Body() body: { ordenId: string }) {
    return this.pagos.confirmarPago(body.ordenId);
  }

  // POST /api/recurrente/webhook  (público, verificado por firma)
  @Post('recurrente/webhook')
  webhook(@Req() req: Request & { rawBody?: Buffer }) {
    return this.pagos.manejarWebhook(
      req.rawBody ?? Buffer.from(''),
      (req.headers ?? {}) as unknown as Record<string, string>,
    );
  }
}
