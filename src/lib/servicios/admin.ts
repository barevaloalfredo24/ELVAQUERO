// =====================================================================
// SERVICIO DE ADMINISTRACIÓN (frontend)
// ---------------------------------------------------------------------
// Consume los endpoints del panel admin. Mantiene un respaldo con datos
// mock si la API no responde.
// =====================================================================

import { ordenes, productos, usuarios, categorias } from "@/lib/datos";
import type {
  Cupon,
  EstadisticasAdmin,
  FiltrosReporte,
  Orden,
  Producto,
  ReporteAdmin,
  Staff,
  Usuario,
} from "@/lib/tipos";
import { peticion } from "@/lib/api";

// Añade categoriaSlug/categoriaNombre a los productos del mock.
function enriquecer(lista: Producto[]): Producto[] {
  return lista.map((p) => {
    const cat = categorias.find((c) => c.id === p.categoriaId);
    return { ...p, categoriaSlug: cat?.slug ?? "", categoriaNombre: cat?.nombre ?? "" };
  });
}

export async function obtenerPedidos(): Promise<Orden[]> {
  const desdeApi = await peticion<Orden[]>("/api/admin/pedidos");
  if (desdeApi) return desdeApi;
  return [...ordenes].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
  );
}

export async function obtenerClientes(): Promise<Usuario[]> {
  const desdeApi = await peticion<Usuario[]>("/api/admin/clientes");
  if (desdeApi) return desdeApi;
  return usuarios.filter((u) => u.rol === "cliente");
}

export async function obtenerStaff(): Promise<Staff[]> {
  const desdeApi = await peticion<Staff[]>("/api/admin/staff");
  return desdeApi ?? [];
}

export async function obtenerCupones(): Promise<Cupon[]> {
  const desdeApi = await peticion<Cupon[]>("/api/admin/cupones");
  return desdeApi ?? [];
}

export async function obtenerReporte(filtros: FiltrosReporte = {}): Promise<ReporteAdmin | null> {
  const qs = new URLSearchParams();
  if (filtros.desde) qs.set("desde", filtros.desde);
  if (filtros.hasta) qs.set("hasta", filtros.hasta);
  if (filtros.categoria) qs.set("categoria", filtros.categoria);
  if (filtros.metodoPago) qs.set("metodoPago", filtros.metodoPago);
  const q = qs.toString();
  return peticion<ReporteAdmin>(`/api/admin/reportes${q ? `?${q}` : ""}`);
}

export async function obtenerAlertasStock(): Promise<Producto[]> {
  const desdeApi = await peticion<Producto[]>("/api/admin/alertas-stock");
  if (desdeApi) return desdeApi;
  return enriquecer(productos.filter((p) => p.stockTotal <= p.umbralStock));
}

export async function obtenerProductosAdmin(): Promise<Producto[]> {
  const desdeApi = await peticion<Producto[]>("/api/admin/productos");
  if (desdeApi) return desdeApi;
  return enriquecer([...productos]);
}

export async function obtenerEstadisticas(): Promise<EstadisticasAdmin> {
  const desdeApi = await peticion<EstadisticasAdmin>("/api/admin/estadisticas");
  if (desdeApi) return desdeApi;

  // --- Respaldo con datos mock (si no hay backend) ---
  const validas = ordenes.filter((o) => o.estado !== "cancelada");
  const ventasTotales = validas.reduce((acc, o) => acc + o.total, 0);
  const numeroOrdenes = validas.length;
  const ticketPromedio = numeroOrdenes ? ventasTotales / numeroOrdenes : 0;

  const porMes = new Map<string, number>();
  for (const o of validas) {
    const etiqueta = new Date(o.fecha).toLocaleDateString("es-GT", { month: "short" });
    porMes.set(etiqueta, (porMes.get(etiqueta) ?? 0) + o.total);
  }
  const ingresosPorMes = Array.from(porMes, ([etiqueta, total]) => ({ etiqueta, total }));

  const porMetodo = new Map<string, number>();
  for (const o of validas) {
    const clave = o.metodoPago === "tarjeta" ? "Tarjeta" : "Contra entrega";
    porMetodo.set(clave, (porMetodo.get(clave) ?? 0) + o.total);
  }
  const ventasPorMetodoPago = Array.from(porMetodo, ([etiqueta, total]) => ({ etiqueta, total }));

  const conteo = new Map<string, number>();
  for (const o of validas) {
    for (const linea of o.items) {
      conteo.set(linea.productoId, (conteo.get(linea.productoId) ?? 0) + linea.cantidad);
    }
  }
  const productosMasVendidos = Array.from(conteo, ([id, cantidad]) => {
    const producto = productos.find((p) => p.id === id);
    return { producto: { id, nombre: producto?.nombre ?? "" }, cantidad };
  }).sort((a, b) => b.cantidad - a.cantidad);

  return {
    ventasTotales,
    numeroOrdenes,
    ticketPromedio,
    clientesRegistrados: usuarios.filter((u) => u.rol === "cliente").length,
    productosActivos: productos.length,
    alertasStock: productos.filter((p) => p.stockTotal <= p.umbralStock).length,
    ingresosPorMes,
    ventasPorMetodoPago,
    productosMasVendidos,
  };
}
