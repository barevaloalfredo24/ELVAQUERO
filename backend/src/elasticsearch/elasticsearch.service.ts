// =====================================================================
// SERVICIO DE ELASTICSEARCH (búsqueda optimizada)
// ---------------------------------------------------------------------
// Conecta con Elasticsearch (Cloud o self-hosted) para indexar productos
// y hacer búsquedas tolerantes a errores y por prefijo. Si no está
// configurado, devuelve null para que el catálogo use el fallback de
// PostgreSQL (pg_trgm).
// =====================================================================

import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';

// Documento que se indexa por producto.
export interface ProductoElasticsearch {
  id: string;
  nombre: string;
  descripcion: string;
  slug: string;
  precio: number;
  categoriaSlug: string;
  categoriaNombre: string;
  estaActivo: boolean;
  imagen: string | null;
}

@Injectable()
export class ElasticsearchService implements OnModuleInit, OnModuleDestroy {
  private client: Client | null = null;
  private readonly logger = new Logger(ElasticsearchService.name);

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const cloudId = this.config.get<string>('ELASTICSEARCH_CLOUD_ID');
    const url = this.config.get<string>('ELASTICSEARCH_URL');
    const apiKey = this.config.get<string>('ELASTICSEARCH_API_KEY');
    const username = this.config.get<string>('ELASTICSEARCH_USERNAME');
    const password = this.config.get<string>('ELASTICSEARCH_PASSWORD');

    if ((!cloudId && !url) || (!apiKey && !username)) {
      this.logger.warn(
        'Elasticsearch no configurado. Se usará la búsqueda de PostgreSQL (pg_trgm).',
      );
      return;
    }

    this.client = new Client({
      ...(cloudId ? { cloud: { id: cloudId } } : { node: url }),
      auth: apiKey
        ? { apiKey }
        : { username: username!, password: password! },
    });

    void this.crearIndice();
  }

  onModuleDestroy() {
    void this.client?.close();
  }

  // Nombre del índice (por defecto "productos").
  private get indexName(): string {
    return this.config.get<string>('ELASTICSEARCH_INDEX') ?? 'productos';
  }

  // Crea el índice con sus mappings si no existe (idempotente).
  private async crearIndice() {
    if (!this.client) return;
    try {
      const existe = await this.client.indices.exists({ index: this.indexName });
      if (!existe) {
        await this.client.indices.create({
          index: this.indexName,
          mappings: {
            properties: {
              nombre: { type: 'text' },
              descripcion: { type: 'text' },
              slug: { type: 'keyword' },
              precio: { type: 'float' },
              categoriaSlug: { type: 'keyword' },
              categoriaNombre: { type: 'keyword' },
              estaActivo: { type: 'boolean' },
              imagen: { type: 'keyword' },
            },
          },
        });
        this.logger.log(`Índice "${this.indexName}" creado.`);
      }
    } catch (e) {
      this.logger.error('No se pudo crear el índice de Elasticsearch.', e);
      this.client = null;
    }
  }

  // Busca productos. Devuelve null si ES no está disponible; si está
  // disponible devuelve los ids (puede ser un arreglo vacío).
  async buscar(query: string, categoriaSlug?: string): Promise<string[] | null> {
    if (!this.client || !query.trim()) return null;
    try {
      const filtros: Record<string, unknown>[] = [
        { term: { estaActivo: true } },
      ];
      if (categoriaSlug) filtros.push({ term: { categoriaSlug } });

      const resultado = await this.client.search({
        index: this.indexName,
        size: 20,
        query: {
          bool: {
            should: [
              {
                multi_match: {
                  query,
                  fields: ['nombre^3', 'descripcion^1'],
                  fuzziness: 'AUTO',
                  prefix_length: 1,
                },
              },
              { match_phrase_prefix: { nombre: { query, boost: 2 } } },
            ],
            minimum_should_match: 1,
            filter: filtros,
          },
        },
      });

      return resultado.hits.hits.map((h) => h._id as string);
    } catch (e) {
      this.logger.error('Error consultando Elasticsearch.', e);
      return null;
    }
  }

  // Indexa (o actualiza) un producto.
  async indexarProducto(doc: ProductoElasticsearch): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.index({
        index: this.indexName,
        id: doc.id,
        document: doc,
        refresh: true,
      });
    } catch (e) {
      this.logger.error(`No se pudo indexar el producto ${doc.id}.`, e);
    }
  }

  // Elimina un producto del índice.
  async eliminarProducto(id: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client
        .delete({ index: this.indexName, id, refresh: true })
        .catch(() => {});
    } catch (e) {
      this.logger.error(`No se pudo eliminar el producto ${id}.`, e);
    }
  }

  // Reindexa todos los productos (sincronización inicial).
  async reindexar(productos: ProductoElasticsearch[]): Promise<void> {
    if (!this.client || productos.length === 0) return;
    try {
      const operaciones = productos.flatMap((p) => [
        { index: { _index: this.indexName, _id: p.id } },
        p,
      ]);
      await this.client.bulk({ operations: operaciones, refresh: true });
      this.logger.log(`Sincronizados ${productos.length} productos en Elasticsearch.`);
    } catch (e) {
      this.logger.error('No se pudo sincronizar Elasticsearch.', e);
    }
  }

  // Indica si Elasticsearch está disponible.
  get disponible(): boolean {
    return this.client !== null;
  }
}
