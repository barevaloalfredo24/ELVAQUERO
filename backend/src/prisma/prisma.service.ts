// =====================================================================
// SERVICIO DE PRISMA
// ---------------------------------------------------------------------
// Extiende PrismaClient y gestiona el ciclo de vida de la conexión a la
// base de datos (conectar al iniciar, desconectar al terminar).
// =====================================================================

import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  // Conecta a la base de datos cuando arranca el módulo.
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  // Cierra la conexión cuando se detiene la aplicación.
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
