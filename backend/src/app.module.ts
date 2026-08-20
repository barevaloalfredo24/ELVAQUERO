// =====================================================================
// MÓDULO PRINCIPAL DE LA APLICACIÓN
// ---------------------------------------------------------------------
// Registra todos los módulos de negocio y la configuración global.
// =====================================================================

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { CatalogoModule } from './catalogo/catalogo.module';
import { AuthModule } from './auth/auth.module';
import { OrdenesModule } from './ordenes/ordenes.module';
import { AdminModule } from './admin/admin.module';
import { GestionModule } from './gestion/gestion.module';
import { ImagenesModule } from './imagenes/imagenes.module';
import { ReportesModule } from './reportes/reportes.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    // Configuración de variables de entorno (global).
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    MailModule,
    CatalogoModule,
    AuthModule,
    OrdenesModule,
    AdminModule,
    GestionModule,
    ImagenesModule,
    ReportesModule,
  ],
})
export class AppModule {}
