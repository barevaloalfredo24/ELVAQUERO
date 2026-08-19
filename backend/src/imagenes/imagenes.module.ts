// =====================================================================
// MÓDULO DE IMÁGENES
// =====================================================================

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ImagenesController } from './imagenes.controller';
import { ImagenesService } from './imagenes.service';

@Module({
  imports: [AuthModule],
  controllers: [ImagenesController],
  providers: [ImagenesService],
})
export class ImagenesModule {}
