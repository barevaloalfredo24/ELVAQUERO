// =====================================================================
// SERVICIO DE CATÁLOGO
// ---------------------------------------------------------------------
// Capa de acceso a datos del catálogo. Hoy lee los datos mock; cuando
// exista backend (NestJS) cada función se convertirá en una llamada
// `fetch()` al endpoint REST correspondiente. Por eso todas devuelven
// `Promise<...>` y comparten la misma firma que tendrá la API real.
// =====================================================================

import { categorias, productos } from "@/lib/datos";
import type { Categoria, FiltrosCatalogo, Producto } from "@/lib/tipos";
import { simularLatencia } from "@/lib/util";

// Devuelve todas las categorías disponibles.
export async function obtenerCategorias(): Promise<Categoria[]> {
  return simularLatencia(categorias);
}

// Devuelve la categoría asociada a un producto.
export function categoriaDe(producto: Producto): Categoria | undefined {
  return categorias.find((c) => c.id === producto.categoriaId);
}

// Lista productos aplicando filtros opcionales (categoría, búsqueda,
// orden y solo oferta). Cada filtro se aplica de forma encadenada.
export async function obtenerProductos(filtros: FiltrosCatalogo = {}): Promise<Producto[]> {
  let resultado = [...productos];

  // Filtro por categoría (por slug).
  if (filtros.categoria) {
    const cat = categorias.find((c) => c.slug === filtros.categoria);
    if (cat) resultado = resultado.filter((p) => p.categoriaId === cat.id);
  }

  // Filtro de texto libre sobre el nombre.
  if (filtros.busqueda) {
    const q = filtros.busqueda.toLowerCase();
    resultado = resultado.filter((p) => p.nombre.toLowerCase().includes(q));
  }

  // Filtro de ofertas.
  if (filtros.soloOferta) {
    resultado = resultado.filter((p) => p.enOferta);
  }

  // Ordenamiento.
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
      // "relevancia": destacados primero, luego por calificación.
      resultado.sort(
        (a, b) => Number(b.destacado) - Number(a.destacado) || b.calificacion - a.calificacion,
      );
  }

  return simularLatencia(resultado);
}

// Obtiene un producto por su id.
export async function obtenerProductoPorId(id: string): Promise<Producto | null> {
  const encontrado = productos.find((p) => p.id === id) ?? null;
  return simularLatencia(encontrado);
}

// Obtiene un producto por su slug (útil para URLs amigables).
export async function obtenerProductoPorSlug(slug: string): Promise<Producto | null> {
  const encontrado = productos.find((p) => p.slug === slug) ?? null;
  return simularLatencia(encontrado);
}

// Productos destacados (para la portada).
export async function obtenerProductosDestacados(): Promise<Producto[]> {
  return simularLatencia(productos.filter((p) => p.destacado));
}

// Productos relacionados: misma categoría, excluyendo el actual.
export async function obtenerProductosRelacionados(
  categoriaId: string,
  excluirId: string,
): Promise<Producto[]> {
  const relacionados = productos
    .filter((p) => p.categoriaId === categoriaId && p.id !== excluirId)
    .slice(0, 4);
  return simularLatencia(relacionados);
}
