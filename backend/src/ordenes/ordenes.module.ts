// =====================================================================
// MÓDULO DE ÓRDENES
// ---------------------------------------------------------------------
// Importa AuthModule para usar la guardia JWT en los endpoints.
// =====================================================================

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OrdenesController } from './ordenes.controller';
import { OrdenesService } from './ordenes.service';

@Module({
  imports: [AuthModule],
  controllers: [OrdenesController],
  providers: [OrdenesService],
  exports: [OrdenesService],
})
export class OrdenesModule {}
