// =====================================================================
// CONTROLADOR DE STAFF (solo administrador)
// ---------------------------------------------------------------------
// CRUD de perfiles de staff bajo /api/admin/staff.
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
import { ActualizarStaffDto, CrearStaffDto } from './dto';
import { StaffDTO, StaffService } from './staff.service';

@Controller('admin/staff')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
export class StaffController {
  constructor(private readonly staff: StaffService) {}

  // POST /api/admin/staff
  @Post()
  crear(@Body() dto: CrearStaffDto): Promise<StaffDTO> {
    return this.staff.crearStaff(dto);
  }

  // PATCH /api/admin/staff/:id
  @Patch(':id')
  actualizar(
    @Param('id') id: string,
    @Body() dto: ActualizarStaffDto,
  ): Promise<StaffDTO> {
    return this.staff.actualizarStaff(id, dto);
  }

  // DELETE /api/admin/staff/:id (desactiva el perfil)
  @Delete(':id')
  desactivar(@Param('id') id: string): Promise<{ id: string }> {
    return this.staff.desactivarStaff(id);
  }
}
