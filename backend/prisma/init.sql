-- =====================================================================
-- ESQUEMA DE BASE DE DATOS "EL VAQUERO" (PostgreSQL)
-- ---------------------------------------------------------------------
-- Script provisto por el cliente. Se ejecuta contra la base para crear
-- el esquema real que consume el backend NestJS + Prisma.
-- =====================================================================

-- EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- para gen_random_uuid()

-- ---------------------------------------------------------------------
-- TIPOS ENUMERADOS
-- ---------------------------------------------------------------------
CREATE TYPE rol_usuario          AS ENUM ('cliente', 'admin', 'staff');
CREATE TYPE proveedor_oauth      AS ENUM ('google');
CREATE TYPE estado_orden         AS ENUM ('pendiente', 'pagado', 'procesando', 'enviado', 'entregado', 'cancelado', 'reembolsado');
CREATE TYPE tipo_metodo_pago     AS ENUM ('tarjeta', 'contra_entrega');
CREATE TYPE estado_pago          AS ENUM ('pendiente', 'exitoso', 'fallido', 'reembolsado');
CREATE TYPE tipo_descuento       AS ENUM ('porcentaje', 'fijo');
CREATE TYPE estado_alerta_stock  AS ENUM ('abierta', 'resuelta');
CREATE TYPE tipo_notificacion    AS ENUM ('stock_bajo', 'nueva_orden', 'pago_fallido', 'nueva_resena');

-- ---------------------------------------------------------------------
-- FUNCIÓN GENÉRICA PARA ACTUALIZAR fecha_actualizacion
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION actualizar_fecha_modificacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- 1. USUARIOS Y AUTENTICACIÓN
-- =====================================================================

CREATE TABLE usuarios (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_completo     VARCHAR(150) NOT NULL,
    correo              VARCHAR(150) NOT NULL UNIQUE,
    contrasena_hash     VARCHAR(255),
    telefono            VARCHAR(30),
    rol                 rol_usuario NOT NULL DEFAULT 'cliente',
    correo_verificado   BOOLEAN NOT NULL DEFAULT FALSE,
    esta_activo         BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion      TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_usuarios_fecha_actualizacion
    BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_modificacion();

CREATE TABLE cuentas_oauth (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id              UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    proveedor               proveedor_oauth NOT NULL,
    id_proveedor_usuario    VARCHAR(255) NOT NULL,
    fecha_creacion          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (proveedor, id_proveedor_usuario)
);

CREATE TABLE verificaciones_correo (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id          UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token               VARCHAR(255) NOT NULL UNIQUE,
    fecha_expiracion    TIMESTAMPTZ NOT NULL,
    fecha_verificacion  TIMESTAMPTZ,
    fecha_creacion      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_verificaciones_usuario ON verificaciones_correo(usuario_id);

CREATE TABLE direcciones (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id          UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    alias               VARCHAR(50),
    calle               VARCHAR(255) NOT NULL,
    ciudad              VARCHAR(100) NOT NULL,
    provincia           VARCHAR(100),
    codigo_postal       VARCHAR(20),
    pais                VARCHAR(100) NOT NULL,
    es_predeterminada   BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_creacion      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_direcciones_usuario ON direcciones(usuario_id);

-- =====================================================================
-- 2. CATÁLOGO DE PRODUCTOS
-- =====================================================================

CREATE TABLE categorias (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre              VARCHAR(100) NOT NULL,
    slug                VARCHAR(120) NOT NULL UNIQUE,
    categoria_padre_id  UUID REFERENCES categorias(id) ON DELETE SET NULL,
    imagen              VARCHAR(500),
    alt                 VARCHAR(255),
    fecha_creacion      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_categorias_padre ON categorias(categoria_padre_id);

CREATE TABLE productos (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria_id        UUID REFERENCES categorias(id) ON DELETE SET NULL,
    nombre              VARCHAR(200) NOT NULL,
    slug                VARCHAR(220) NOT NULL UNIQUE,
    descripcion         TEXT,
    precio_base         NUMERIC(12,2) NOT NULL CHECK (precio_base >= 0),
    esta_activo         BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion      TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_productos_fecha_actualizacion
    BEFORE UPDATE ON productos
    FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_modificacion();

CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_productos_activo ON productos(esta_activo);

CREATE TABLE variantes_producto (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id             UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    sku                     VARCHAR(100) NOT NULL UNIQUE,
    atributos               JSONB NOT NULL DEFAULT '{}',
    precio_alternativo      NUMERIC(12,2) CHECK (precio_alternativo >= 0),
    cantidad_stock          INTEGER NOT NULL DEFAULT 0 CHECK (cantidad_stock >= 0),
    umbral_stock_bajo       INTEGER NOT NULL DEFAULT 5,
    esta_activo             BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion          TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_actualizacion     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_variantes_fecha_actualizacion
    BEFORE UPDATE ON variantes_producto
    FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_modificacion();

CREATE INDEX idx_variantes_producto ON variantes_producto(producto_id);
CREATE INDEX idx_variantes_stock ON variantes_producto(cantidad_stock);

CREATE TABLE imagenes_producto (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id     UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    url             VARCHAR(500) NOT NULL,
    texto_alternativo VARCHAR(255),
    posicion        SMALLINT NOT NULL DEFAULT 0,
    fecha_creacion  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_imagenes_producto ON imagenes_producto(producto_id);

-- =====================================================================
-- 3. CARRITO DE COMPRAS
-- =====================================================================

CREATE TABLE carritos (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id          UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    id_sesion           VARCHAR(255),
    fecha_creacion      TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_carritos_fecha_actualizacion
    BEFORE UPDATE ON carritos
    FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_modificacion();

CREATE INDEX idx_carritos_usuario ON carritos(usuario_id);
CREATE INDEX idx_carritos_sesion ON carritos(id_sesion);

CREATE TABLE items_carrito (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    carrito_id      UUID NOT NULL REFERENCES carritos(id) ON DELETE CASCADE,
    variante_id     UUID NOT NULL REFERENCES variantes_producto(id) ON DELETE CASCADE,
    cantidad        INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(12,2) NOT NULL,
    fecha_agregado  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (carrito_id, variante_id)
);

CREATE INDEX idx_items_carrito_carrito ON items_carrito(carrito_id);

-- =====================================================================
-- 4. CUPONES Y OFERTAS
-- =====================================================================

CREATE TABLE cupones (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo              VARCHAR(50) NOT NULL UNIQUE,
    tipo_descuento      tipo_descuento NOT NULL,
    valor_descuento     NUMERIC(12,2) NOT NULL CHECK (valor_descuento > 0),
    monto_minimo_orden  NUMERIC(12,2) DEFAULT 0,
    limite_uso          INTEGER,
    veces_usado         INTEGER NOT NULL DEFAULT 0,
    fecha_inicio_validez TIMESTAMPTZ NOT NULL,
    fecha_fin_validez   TIMESTAMPTZ NOT NULL,
    esta_activo         BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- 5. ÓRDENES / CHECKOUT
-- =====================================================================

CREATE TABLE ordenes (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_orden            VARCHAR(30) NOT NULL UNIQUE,
    usuario_id              UUID NOT NULL REFERENCES usuarios(id),
    estado                  estado_orden NOT NULL DEFAULT 'pendiente',
    metodo_pago             tipo_metodo_pago NOT NULL,
    direccion_envio_id      UUID REFERENCES direcciones(id),
    direccion_facturacion_id UUID REFERENCES direcciones(id),
    cupon_id                UUID REFERENCES cupones(id),
    subtotal                NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
    descuento_total         NUMERIC(12,2) NOT NULL DEFAULT 0,
    envio_total             NUMERIC(12,2) NOT NULL DEFAULT 0,
    impuestos_total         NUMERIC(12,2) NOT NULL DEFAULT 0,
    total                   NUMERIC(12,2) NOT NULL CHECK (total >= 0),
    moneda                  CHAR(3) NOT NULL DEFAULT 'GTQ',
    fecha_creacion          TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_actualizacion     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_ordenes_fecha_actualizacion
    BEFORE UPDATE ON ordenes
    FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_modificacion();

CREATE INDEX idx_ordenes_usuario ON ordenes(usuario_id);
CREATE INDEX idx_ordenes_estado ON ordenes(estado);
CREATE INDEX idx_ordenes_fecha ON ordenes(fecha_creacion);

CREATE TABLE items_orden (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_id                UUID NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,
    variante_id             UUID NOT NULL REFERENCES variantes_producto(id),
    nombre_producto_snapshot VARCHAR(200) NOT NULL,
    sku_snapshot            VARCHAR(100) NOT NULL,
    precio_unitario         NUMERIC(12,2) NOT NULL,
    cantidad                INTEGER NOT NULL CHECK (cantidad > 0),
    subtotal                NUMERIC(12,2) NOT NULL
);

CREATE INDEX idx_items_orden_orden ON items_orden(orden_id);
CREATE INDEX idx_items_orden_variante ON items_orden(variante_id);

CREATE TABLE historial_estados_orden (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_id        UUID NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,
    estado          estado_orden NOT NULL,
    modificado_por  UUID REFERENCES usuarios(id),
    fecha_cambio    TIMESTAMPTZ NOT NULL DEFAULT now(),
    nota            TEXT
);

CREATE INDEX idx_historial_estados_orden ON historial_estados_orden(orden_id);

CREATE TABLE redenciones_cupon (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cupon_id        UUID NOT NULL REFERENCES cupones(id) ON DELETE CASCADE,
    usuario_id      UUID NOT NULL REFERENCES usuarios(id),
    orden_id        UUID NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,
    fecha_redencion TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_redenciones_cupon ON redenciones_cupon(cupon_id);

-- =====================================================================
-- 6. PAGOS (Stripe / contra entrega)
-- =====================================================================

CREATE TABLE pagos (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_id                UUID NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,
    metodo                  tipo_metodo_pago NOT NULL,
    estado                  estado_pago NOT NULL DEFAULT 'pendiente',
    id_intento_pago_stripe  VARCHAR(255),
    monto                   NUMERIC(12,2) NOT NULL,
    moneda                  CHAR(3) NOT NULL DEFAULT 'GTQ',
    fecha_pago              TIMESTAMPTZ,
    fecha_creacion          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pagos_orden ON pagos(orden_id);
CREATE UNIQUE INDEX idx_pagos_intento_stripe ON pagos(id_intento_pago_stripe)
    WHERE id_intento_pago_stripe IS NOT NULL;

-- =====================================================================
-- 7. RESEÑAS Y LISTA DE DESEOS
-- =====================================================================

CREATE TABLE resenas (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id     UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    usuario_id      UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    calificacion    SMALLINT NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
    comentario      TEXT,
    esta_aprobada   BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_creacion  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (producto_id, usuario_id)
);

CREATE INDEX idx_resenas_producto ON resenas(producto_id);

CREATE TABLE listas_deseos (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id      UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    producto_id     UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    fecha_agregado  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (usuario_id, producto_id)
);

CREATE INDEX idx_listas_deseos_usuario ON listas_deseos(usuario_id);

-- =====================================================================
-- 8. RECOMENDACIONES (nivel 1)
-- =====================================================================

CREATE TABLE vistas_producto (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id      UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    id_sesion       VARCHAR(255),
    producto_id     UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    fecha_vista     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vistas_producto_usuario ON vistas_producto(usuario_id);
CREATE INDEX idx_vistas_producto_producto ON vistas_producto(producto_id);
CREATE INDEX idx_vistas_producto_fecha ON vistas_producto(fecha_vista);

-- =====================================================================
-- 9. ALERTAS DE BAJO STOCK Y NOTIFICACIONES
-- =====================================================================

CREATE TABLE alertas_stock (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variante_id             UUID NOT NULL REFERENCES variantes_producto(id) ON DELETE CASCADE,
    umbral_al_disparar      INTEGER NOT NULL,
    stock_al_disparar       INTEGER NOT NULL,
    estado                  estado_alerta_stock NOT NULL DEFAULT 'abierta',
    fecha_notificacion      TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_resolucion        TIMESTAMPTZ
);

CREATE INDEX idx_alertas_stock_variante ON alertas_stock(variante_id);
CREATE INDEX idx_alertas_stock_estado ON alertas_stock(estado);

CREATE TABLE notificaciones_admin (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo                    tipo_notificacion NOT NULL,
    mensaje                 TEXT NOT NULL,
    id_entidad_relacionada  UUID,
    esta_leida              BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_creacion          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notificaciones_tipo ON notificaciones_admin(tipo);
CREATE INDEX idx_notificaciones_leida ON notificaciones_admin(esta_leida);

-- =====================================================================
-- 10. VISTAS DE APOYO PARA REPORTES
-- =====================================================================

CREATE OR REPLACE VIEW vista_ventas_diarias AS
SELECT
    date_trunc('day', o.fecha_creacion)  AS fecha_venta,
    o.metodo_pago,
    COUNT(DISTINCT o.id)                 AS total_ordenes,
    SUM(o.total)                         AS ingresos_totales,
    AVG(o.total)                         AS ticket_promedio
FROM ordenes o
WHERE o.estado IN ('pagado', 'procesando', 'enviado', 'entregado')
GROUP BY 1, 2;

CREATE OR REPLACE VIEW vista_productos_bajo_stock AS
SELECT
    p.id            AS producto_id,
    p.nombre        AS nombre_producto,
    v.id            AS variante_id,
    v.sku,
    v.cantidad_stock,
    v.umbral_stock_bajo
FROM variantes_producto v
JOIN productos p ON p.id = v.producto_id
WHERE v.cantidad_stock <= v.umbral_stock_bajo
  AND v.esta_activo = TRUE;

-- =====================================================================
-- FIN DEL SCRIPT
