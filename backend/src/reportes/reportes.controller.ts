// =====================================================================
// CONTROLADOR DE REPORTES
// ---------------------------------------------------------------------
// Endpoint del panel de reportes con filtros por query params.
// =====================================================================

import { Controller, Get, Query } from '@nestjs/common';
import { ReporteDTO, ReportesService } from './reportes.service';

@Controller('admin/reportes')
export class ReportesController {
  constructor(private readonly reportes: ReportesService) {}

  // GET /api/admin/reportes?desde=&hasta=&categoria=&metodoPago=
  @Get()
  generar(
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('categoria') categoria?: string,
    @Query('metodoPago') metodoPago?: string,
  ): Promise<ReporteDTO> {
    return this.reportes.generarReporte({
      desde,
      hasta,
      categoria,
      metodoPago,
    });
  }
}
