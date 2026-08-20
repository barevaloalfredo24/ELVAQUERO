// =====================================================================
// MÓDULO DE PAGOS
// =====================================================================

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OrdenesModule } from '../ordenes/ordenes.module';
import { PagosController } from './pagos.controller';
import { PagosService } from './pagos.service';

@Module({
  imports: [AuthModule, OrdenesModule],
  controllers: [PagosController],
  providers: [PagosService],
})
export class PagosModule {}
