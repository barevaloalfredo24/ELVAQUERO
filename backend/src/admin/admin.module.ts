// =====================================================================
// MÓDULO DE ADMINISTRACIÓN
// ---------------------------------------------------------------------
// Importa CatalogoModule para reutilizar el servicio de catálogo.
// =====================================================================

import { Module } from '@nestjs/common';
import { CatalogoModule } from '../catalogo/catalogo.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [CatalogoModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
