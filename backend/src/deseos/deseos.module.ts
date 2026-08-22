// =====================================================================
// MÓDULO DE LISTA DE DESEOS
// =====================================================================

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CatalogoModule } from '../catalogo/catalogo.module';
import { DeseosController } from './deseos.controller';
import { DeseosService } from './deseos.service';

@Module({
  imports: [AuthModule, CatalogoModule],
  controllers: [DeseosController],
  providers: [DeseosService],
})
export class DeseosModule {}
