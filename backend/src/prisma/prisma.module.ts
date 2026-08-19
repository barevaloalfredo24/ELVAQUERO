// =====================================================================
// MÓDULO GLOBAL DE PRISMA
// ---------------------------------------------------------------------
// Marca el PrismaService como global para poder inyectarlo en cualquier
// otro módulo sin necesidad de importar PrismaModule explícitamente.
// =====================================================================

import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
