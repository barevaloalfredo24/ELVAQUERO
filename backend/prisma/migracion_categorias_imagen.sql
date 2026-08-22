-- =====================================================================
-- MIGRACIÓN: agrega imagen y alt a la tabla categorias
-- ---------------------------------------------------------------------
-- Se aplica de forma idempotente con `prisma db execute`.
-- =====================================================================

ALTER TABLE categorias ADD COLUMN IF NOT EXISTS imagen VARCHAR(500);
ALTER TABLE categorias ADD COLUMN IF NOT EXISTS alt VARCHAR(255);
