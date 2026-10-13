// =====================================================================
// MÓDULO DE ELASTICSEARCH (global)
// ---------------------------------------------------------------------
// Marca el servicio como global para poder inyectarlo en cualquier módulo
// sin importarlo explícitamente.
// =====================================================================

import { Global, Module } from '@nestjs/common';
import { ElasticsearchService } from './elasticsearch.service';

@Global()
@Module({
  providers: [ElasticsearchService],
  exports: [ElasticsearchService],
})
export class ElasticsearchModule {}
