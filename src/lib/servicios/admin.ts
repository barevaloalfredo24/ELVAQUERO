// =====================================================================
// SERVICIO DE ADMINISTRACIÓN
// ---------------------------------------------------------------------
// Funciones que alimentan el panel administrativo: estadísticas,
// pedidos, clientes y alertas de inventario. Igual que el catálogo,
// hoy leen datos mock y luego pasarán a consumir la API REST.
// =====================================================================

import { ordenes, productos, usuarios } from "@/lib/datos";
import type { EstadisticasAdmin, Orden, Producto, Usuario } from "@/lib/tipos";
import { simularLatencia } from "@/lib/util";

// Cálculo del total de una orden (subtotal + envío).
const totalOrden = (o: Orden) => o.total;

// Devuelve todas las órdenes, de la más reciente a la más antigua.
export async function obtenerPedidos(): Promise<Orden[]> {
  const ordenadas = [...ordenes].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
  );
  return simularLatencia(ordenadas);
}

// Devuelve los clientes registrados (no administradores).
export async function obtenerClientes(): Promise<Usuario[]> {
  return simularLatencia(usuarios.filter((u) => u.rol === "cliente"));
}

// Devuelve los productos cuyo stock está por debajo de su umbral.
export async function obtenerAlertasStock(): Promise<Producto[]> {
  const alertas = productos.filter((p) => p.stockTotal <= p.umbralStock);
  return simularLatencia(alertas);
}

// Devuelve todos los productos (para la tabla de administración).
export async function obtenerProductosAdmin(): Promise<Producto[]> {
  return simularLatencia([...productos]);
}

// Calcula las estadísticas resumidas del panel principal.
export async function obtenerEstadisticas(): Promise<EstadisticasAdmin> {
  // Total facturado solo de órdenes que no están canceladas.
  const ordenesValidas = ordenes.filter((o) => o.estado !== "cancelada");
  const ventasTotales = ordenesValidas.reduce((acc, o) => acc + totalOrden(o), 0);
  const numeroOrdenes = ordenesValidas.length;
  const ticketPromedio = numeroOrdenes ? ventasTotales / numeroOrdenes : 0;

  // Agrupa ingresos por mes para la gráfica de barras.
  const porMes = new Map<string, number>();
  for (const o of ordenesValidas) {
    const etiqueta = new Date(o.fecha).toLocaleDateString("es-GT", { month: "short" });
    porMes.set(etiqueta, (porMes.get(etiqueta) ?? 0) + totalOrden(o));
  }
  const ingresosPorMes = Array.from(porMes, ([etiqueta, total]) => ({ etiqueta, total }));

  // Ventas por método de pago.
  const porMetodo = new Map<string, number>();
  for (const o of ordenesValidas) {
    const clave = o.metodoPago === "tarjeta" ? "Tarjeta" : "Contra entrega";
    porMetodo.set(clave, (porMetodo.get(clave) ?? 0) + totalOrden(o));
  }
  const ventasPorMetodoPago = Array.from(porMetodo, ([etiqueta, total]) => ({ etiqueta, total }));

  // Productos más vendidos (sumando cantidades de todas las órdenes).
  const conteo = new Map<string, number>();
  for (const o of ordenesValidas) {
    for (const linea of o.items) {
      conteo.set(linea.productoId, (conteo.get(linea.productoId) ?? 0) + linea.cantidad);
    }
  }
  const productosMasVendidos = Array.from(conteo, ([id, cantidad]) => {
    const producto = productos.find((p) => p.id === id);
    return { producto: producto!, cantidad };
  }).sort((a, b) => b.cantidad - a.cantidad);

  // Cuenta de alertas de stock.
  const alertasStock = productos.filter((p) => p.stockTotal <= p.umbralStock).length;

  return simularLatencia({
    ventasTotales,
    numeroOrdenes,
    ticketPromedio,
    clientesRegistrados: usuarios.filter((u) => u.rol === "cliente").length,
    productosActivos: productos.length,
    alertasStock,
    ingresosPorMes,
    ventasPorMetodoPago,
    productosMasVendidos,
  });
}
