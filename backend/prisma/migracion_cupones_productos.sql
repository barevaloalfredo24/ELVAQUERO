-- =====================================================================
-- MIGRACIÓN: tabla cupones_productos (descuentos por producto)
-- ---------------------------------------------------------------------
-- Relaciona cupones de tipo porcentaje con productos específicos.
-- Idempotente.
-- =====================================================================

CREATE TABLE IF NOT EXISTS cupones_productos (
    cupon_id    UUID NOT NULL REFERENCES cupones(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    PRIMARY KEY (cupon_id, producto_id)
);

CREATE INDEX IF NOT EXISTS idx_cupones_productos_producto
    ON cupones_productos(producto_id);
