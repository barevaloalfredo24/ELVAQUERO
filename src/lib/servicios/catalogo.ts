// =====================================================================
// SERVICIO DE CATÁLOGO (frontend)
// ---------------------------------------------------------------------
// Consume la API NestJS. Si la API no está disponible (NEXT_PUBLIC_API_URL
// sin configurar o backend caído), usa los datos mock como respaldo para
// que la tienda siga mostrando contenido.
// =====================================================================

import { categorias, productos } from "@/lib/datos";
import type { Categoria, Cupon, FiltrosCatalogo, Producto } from "@/lib/tipos";
import { peticion } from "@/lib/api";

// Añade categoriaSlug/categoriaNombre a los productos del mock.
function enriquecer(lista: Producto[]): Producto[] {
  return lista.map((p) => {
    const cat = categorias.find((c) => c.id === p.categoriaId);
    return { ...p, categoriaSlug: cat?.slug ?? "", categoriaNombre: cat?.nombre ?? "" };
  });
}

// Filtrado local (solo se usa como respaldo si la API no responde).
function filtrarMock(filtros: FiltrosCatalogo): Producto[] {
  let resultado = [...productos];
  if (filtros.categoria) {
    const cat = categorias.find((c) => c.slug === filtros.categoria);
    if (cat) resultado = resultado.filter((p) => p.categoriaId === cat.id);
  }
  if (filtros.busqueda) {
    const q = filtros.busqueda.toLowerCase();
    resultado = resultado.filter((p) => p.nombre.toLowerCase().includes(q));
  }
  if (filtros.soloOferta) resultado = resultado.filter((p) => p.enOferta);
  switch (filtros.orden) {
    case "precio-asc":
      resultado.sort((a, b) => a.precio - b.precio);
      break;
    case "precio-desc":
      resultado.sort((a, b) => b.precio - a.precio);
      break;
    case "nombre":
      resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));
      break;
    default:
      resultado.sort(
        (a, b) => Number(b.destacado) - Number(a.destacado) || b.calificacion - a.calificacion,
      );
  }
  return enriquecer(resultado);
}

export async function obtenerCategorias(): Promise<Categoria[]> {
  const desdeApi = await peticion<Categoria[]>("/api/catalogo/categorias");
  return desdeApi ?? categorias;
}

// Cupones activos y vigentes (para mostrar a los clientes).
export async function obtenerCuponesActivos(): Promise<Cupon[]> {
  const desdeApi = await peticion<Cupon[]>("/api/catalogo/cupones");
  return desdeApi ?? [];
}

export async function obtenerProductos(filtros: FiltrosCatalogo = {}): Promise<Producto[]> {
  const qs = new URLSearchParams();
  if (filtros.categoria) qs.set("categoria", filtros.categoria);
  if (filtros.busqueda) qs.set("busqueda", filtros.busqueda);
  if (filtros.orden) qs.set("orden", filtros.orden);
  const q = qs.toString();
  const desdeApi = await peticion<Producto[]>(`/api/catalogo/productos${q ? `?${q}` : ""}`);
  return desdeApi ?? filtrarMock(filtros);
}

export async function obtenerProductoPorId(id: string): Promise<Producto | null> {
  const desdeApi = await peticion<Producto>(`/api/catalogo/productos/${id}`);
  if (desdeApi) return desdeApi;
  const p = productos.find((x) => x.id === id);
  return p ? enriquecer([p])[0] : null;
}

export async function obtenerProductoPorSlug(slug: string): Promise<Producto | null> {
  const desdeApi = await peticion<Producto>(`/api/catalogo/productos/slug/${slug}`);
  if (desdeApi) return desdeApi;
  const p = productos.find((x) => x.slug === slug);
  return p ? enriquecer([p])[0] : null;
}

// Productos más recientes (sección "Novedades" de la portada).
export async function obtenerProductosNovedades(): Promise<Producto[]> {
  const desdeApi = await peticion<Producto[]>("/api/catalogo/productos/novedades");
  return desdeApi ?? enriquecer(productos.slice(0, 8));
}

// Productos relacionados (misma categoría, excluyendo el actual).
export async function obtenerProductosRelacionados(
  categoriaId: string,
  excluirId: string,
): Promise<Producto[]> {
  const desdeApi = await peticion<Producto[]>(`/api/catalogo/productos/${excluirId}/relacionados`);
  if (desdeApi) return desdeApi;
  return enriquecer(
    productos.filter((p) => p.categoriaId === categoriaId && p.id !== excluirId).slice(0, 4),
  );
}
