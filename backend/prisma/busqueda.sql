-- =====================================================================
-- BÚSQUEDA POR SIMILITUD (pg_trgm)
-- ---------------------------------------------------------------------
-- Habilita la extensión pg_trgm y crea un índice GIN sobre el nombre de
-- los productos para búsquedas tolerantes a errores ortográficos y por
-- prefijo (autocompletado).
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_productos_nombre_trgm
  ON productos USING gin (nombre gin_trgm_ops);
