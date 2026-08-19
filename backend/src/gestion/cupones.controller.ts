// =====================================================================
// CONTROLADOR DE CUPONES (solo administrador)
// ---------------------------------------------------------------------
// CRUD de cupones bajo /api/admin/cupones.
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
import { CuponesGestionService, CuponDTO } from './cupones.service';
import { ActualizarCuponDto, CrearCuponDto } from './dto';

@Controller('admin/cupones')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
export class CuponesGestionController {
  constructor(private readonly cupones: CuponesGestionService) {}

  // POST /api/admin/cupones
  @Post()
  crear(@Body() dto: CrearCuponDto): Promise<CuponDTO> {
    return this.cupones.crearCupon(dto);
  }

  // PATCH /api/admin/cupones/:id
  @Patch(':id')
  actualizar(
    @Param('id') id: string,
    @Body() dto: ActualizarCuponDto,
  ): Promise<CuponDTO> {
    return this.cupones.actualizarCupon(id, dto);
  }

  // DELETE /api/admin/cupones/:id (desactiva el cupón)
  @Delete(':id')
  desactivar(@Param('id') id: string): Promise<{ id: string }> {
    return this.cupones.desactivarCupon(id);
  }
}
