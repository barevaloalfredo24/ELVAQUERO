// =====================================================================
// TIPOS COMPARTIDOS DE LA TIENDA "EL VAQUERO"
// ---------------------------------------------------------------------
// Estos tipos reflejan el modelo de datos que expondrá el backend
// (NestJS + PostgreSQL). Mantenerlos en un solo archivo permite
// reutilizarlos en toda la app y actualizarlos en un único lugar.
// =====================================================================

// Rol del usuario dentro de la plataforma.
export type Rol = "cliente" | "admin" | "staff";

// Método con el que el usuario creó su cuenta.
export type MetodoRegistro = "correo" | "google";

// Métodos de pago soportados en el checkout.
export type MetodoPago = "tarjeta" | "contra_entrega";

// Estados posibles de una orden de compra.
export type EstadoOrden =
  | "pendiente" // Orden creada, aún sin confirmar pago
  | "pago_pendiente" // Pago contra entrega (se cobra al entregar)
  | "pagada" // Pago confirmado (tarjeta vía webhook)
  | "enviada" // Orden en tránsito
  | "entregada" // Entregada al cliente
  | "cancelada"; // Cancelada

// Moneda soportada por la tienda.
export type Moneda = "GTQ" | "USD";

// ---------------------------------------------------------------------
// Catálogo
// ---------------------------------------------------------------------

// Una categoría de productos (botas, sombreros, etc.).
// descripcion e icono son opcionales: la base de datos no los contempla;
// el icono se deriva del slug con la utilidad emojiCategoria().
export interface Categoria {
  id: string;
  nombre: string;
  slug: string;
  descripcion?: string;
  icono?: string;
}

// Variante de un producto (talla + color) con su propio stock y precio.
export interface Variante {
  id: string;
  talla: string;
  color: string;
  stock: number;
  precio: number;
}

// Imagen de producto (almacenada en Cloudinary).
export interface Imagen {
  id: string;
  url: string;
  posicion: number;
}

// Producto del catálogo.
export interface Producto {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string;
  categoriaId: string;
  categoriaSlug?: string;
  categoriaNombre?: string;
  precio: number; // Precio base (Q)
  precioAnterior?: number; // Precio tachado cuando hay oferta
  moneda: Moneda;
  imagenes: Imagen[];
  variantes: Variante[];
  destacado: boolean; // Aparece en la portada
  enOferta: boolean;
  calificacion: number; // 0 a 5
  numResenas: number;
  stockTotal: number; // Suma del stock de todas las variantes
  umbralStock: number; // Umbral para alerta de bajo stock
  disponible: boolean;
}

// Filtros que acepta el servicio de catálogo.
export interface FiltrosCatalogo {
  categoria?: string; // slug de la categoría
  busqueda?: string; // texto libre sobre el nombre
  orden?: "relevancia" | "precio-asc" | "precio-desc" | "nombre";
  soloOferta?: boolean;
}

// ---------------------------------------------------------------------
// Usuarios / autenticación
// ---------------------------------------------------------------------

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  verificado: boolean; // ¿Confirmó su correo?
  metodoRegistro: MetodoRegistro;
  telefono?: string;
  direccion?: string;
  fechaRegistro: string; // ISO date
}

// Perfil de staff (gestionado por el administrador).
export interface Staff {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  estaActivo: boolean;
  fechaRegistro: string;
}

// Cupón de descuento (gestionado por el administrador).
export interface Cupon {
  id: string;
  codigo: string;
  tipoDescuento: "porcentaje" | "fijo";
  valorDescuento: number;
  montoMinimoOrden: number;
  limiteUso: number | null;
  vecesUsado: number;
  fechaInicioValidez: string; // ISO date
  fechaFinValidez: string; // ISO date
  estaActivo: boolean;
}

// ---------------------------------------------------------------------
// Carrito y órdenes
// ---------------------------------------------------------------------

// Elemento del carrito: referencia a producto + variante + cantidad.
export interface ItemCarrito {
  productoId: string;
  varianteId: string;
  cantidad: number;
}

// Línea ya "resuelta" dentro de una orden (conserva snapshot del precio).
export interface LineaOrden {
  productoId: string;
  nombre: string;
  variante: string; // p. ej. "Talla 42 · Negro"
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

// Orden de compra generada en el checkout.
export interface Orden {
  id: string;
  clienteId: string;
  clienteNombre: string;
  clienteEmail: string;
  items: LineaOrden[];
  subtotal: number;
  descuento: number;
  envio: number;
  total: number;
  metodoPago: MetodoPago;
  estado: EstadoOrden;
  direccionEnvio: string;
  telefono: string;
  fecha: string; // ISO datetime
}

// ---------------------------------------------------------------------
// Estadísticas del panel administrativo
// ---------------------------------------------------------------------

export interface PuntoSerie {
  etiqueta: string;
  total: number;
}

export interface EstadisticasAdmin {
  ventasTotales: number;
  numeroOrdenes: number;
  ticketPromedio: number;
  clientesRegistrados: number;
  productosActivos: number;
  alertasStock: number;
  ingresosPorMes: PuntoSerie[];
  ventasPorMetodoPago: PuntoSerie[];
  productosMasVendidos: { producto: { id: string; nombre: string }; cantidad: number }[];
}
