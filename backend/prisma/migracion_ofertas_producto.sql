-- =====================================================================
-- MIGRACIÓN: ofertas por producto (descuento_porcentaje)
-- ---------------------------------------------------------------------
-- Reemplaza el modelo de cupones por producto por un campo directo de
-- descuento en la tabla productos. Idempotente.
-- =====================================================================

DROP TABLE IF EXISTS cupones_productos;

ALTER TABLE productos ADD COLUMN IF NOT EXISTS descuento_porcentaje NUMERIC(5, 2);
