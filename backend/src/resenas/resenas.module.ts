// =====================================================================
// MÓDULO DE RESEÑAS
// =====================================================================

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ResenasController } from './resenas.controller';
import { ResenasService } from './resenas.service';

@Module({
  imports: [AuthModule],
  controllers: [ResenasController],
  providers: [ResenasService],
})
export class ResenasModule {}
