// =====================================================================
// MÓDULO DE GESTIÓN (staff y productos)
// ---------------------------------------------------------------------
// Agrupa los controladores de administración con control de roles.
// =====================================================================

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CategoriasGestionController } from './categorias.controller';
import { CategoriasGestionService } from './categorias.service';
import { CuponesGestionController } from './cupones.controller';
import { CuponesGestionService } from './cupones.service';
import { ProductosGestionController } from './productos.controller';
import { ProductosGestionService } from './productos.service';
import { PedidosGestionController } from './pedidos.controller';
import { PedidosGestionService } from './pedidos.service';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';

@Module({
  imports: [AuthModule],
  controllers: [
    StaffController,
    ProductosGestionController,
    CategoriasGestionController,
    CuponesGestionController,
    PedidosGestionController,
  ],
  providers: [
    StaffService,
    ProductosGestionService,
    CategoriasGestionService,
    CuponesGestionService,
    PedidosGestionService,
  ],
})
export class GestionModule {}
