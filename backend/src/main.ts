// =====================================================================
// PUNTO DE ENTRADA DEL BACKEND
// ---------------------------------------------------------------------
// Configura CORS, el prefijo global "/api", la validación automática de
// DTOs y el puerto (por defecto 4000).
// =====================================================================

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // rawBody: true habilita request.rawBody para verificar la firma de webhooks.
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Prefijo global: todos los endpoints quedan bajo /api/...
  app.setGlobalPrefix('api');

  // CORS abierto para desarrollo (restringir orígenes en producción).
app.enableCors({
  origin: [
    'https://elvaquero-2lvh.vercel.app', // Tu frontend en producción
    'http://localhost:3000',            // Desarrollo local Next.js
  ],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  credentials: true,
});
  // Valida y transforma los DTOs automáticamente.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.listen(process.env.PORT ?? 4000);
}

void bootstrap();
