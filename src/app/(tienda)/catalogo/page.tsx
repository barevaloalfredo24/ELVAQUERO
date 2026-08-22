// =====================================================================
// PÁGINA DE CATÁLOGO
// ---------------------------------------------------------------------
// Componente de servidor que lee los parámetros de búsqueda de la URL
// (categoria, busqueda, orden, oferta) y filtra los productos en el
// servidor. Los filtros se envían mediante formularios GET normales,
// por lo que no requiere JavaScript y mantiene el SEO/SSR.
// =====================================================================

import Link from "next/link";
import { obtenerCategorias, obtenerProductos } from "@/lib/servicios/catalogo";
import type { FiltrosCatalogo } from "@/lib/tipos";
import { TarjetaProducto } from "@/components/tienda/TarjetaProducto";

// Valores permitidos para el ordenamiento.
const ORDENES_VALIDOS = ["relevancia", "precio-asc", "precio-desc", "nombre"] as const;
type OrdenValido = (typeof ORDENES_VALIDOS)[number];

export default async function PaginaCatalogo({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Los searchParams son una Promise en Next.js 16: hay que "await"-los.
  const params = await searchParams;

  // Extrae cada parámetro de forma segura (puede llegar como arreglo).
  const categoria = typeof params.categoria === "string" ? params.categoria : undefined;
  const busqueda = typeof params.busqueda === "string" ? params.busqueda : undefined;
  const oferta = params.oferta === "1";
  const ordenParam = typeof params.orden === "string" ? params.orden : "relevancia";
  const orden: OrdenValido = ORDENES_VALIDOS.includes(ordenParam as OrdenValido)
    ? (ordenParam as OrdenValido)
    : "relevancia";

  // Construye el objeto de filtros para el servicio.
  const filtros: FiltrosCatalogo = { categoria, busqueda, orden, soloOferta: oferta || undefined };

  // Carga datos.
  const [categorias, productos] = await Promise.all([
    obtenerCategorias(),
    obtenerProductos(filtros),
  ]);

  // Nombre de la categoría activa (para el encabezado).
  const categoriaActiva = categorias.find((c) => c.slug === categoria);

  // Genera la URL de una categoría conservando el estado de "oferta".
  const urlCategoria = (slug: string) =>
    `/catalogo?categoria=${slug}${oferta ? "&oferta=1" : ""}`;

  return (
    <div className="contenedor py-8">
      {/* Encabezado con título y descripción. */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-marron-900 sm:text-3xl">
          {categoriaActiva ? categoriaActiva.nombre : "Catálogo completo"}
        </h1>
        <p className="mt-1 text-sm text-marron-500">
          {productos.length} producto{productos.length !== 1 ? "s" : ""}
          {categoriaActiva ? ` · ${categoriaActiva.nombre}` : " · Todos los productos"}
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* ============ LISTA DE CATEGORÍAS (ESCRITORIO) ============ */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-marron-500">
            Categorías
          </h2>
          <ul className="space-y-1">
            {/* Enlace "Todo" para limpiar la categoría. */}
            <li>
              <Link
                href={oferta ? "/catalogo?oferta=1" : "/catalogo"}
                className={`block rounded-md px-3 py-2 text-sm ${
                  !categoria ? "bg-marron-100 font-semibold text-marron-900" : "text-marron-700 hover:bg-marron-50"
                }`}
              >
                Todas
              </Link>
            </li>
            {categorias.map((c) => (
              <li key={c.id}>
                <Link
                  href={urlCategoria(c.slug)}
                  className={`block rounded-md px-3 py-2 text-sm ${
                    categoria === c.slug
                      ? "bg-marron-100 font-semibold text-marron-900"
                      : "text-marron-700 hover:bg-marron-50"
                  }`}
                >
                  {c.nombre}
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        {/* ============ CONTENIDO PRINCIPAL ============ */}
        <div className="min-w-0 flex-1">
          {/* Categorías en píldoras horizontales (MÓVIL/TABLET). */}
          <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-2 lg:hidden">
            <Link
              href={oferta ? "/catalogo?oferta=1" : "/catalogo"}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm ${
                !categoria ? "bg-marron-700 text-white" : "bg-white text-marron-700 ring-1 ring-marron-200"
              }`}
            >
              Todas
            </Link>
            {categorias.map((c) => (
              <Link
                key={c.id}
                href={urlCategoria(c.slug)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm ${
                  categoria === c.slug
                    ? "bg-marron-700 text-white"
                    : "bg-white text-marron-700 ring-1 ring-marron-200"
                }`}
              >
                {c.nombre}
              </Link>
            ))}
          </div>

          {/* ============ FORMULARIO DE FILTROS (GET) ============ */}
          <form
            action="/catalogo"
            method="get"
            className="mb-6 flex flex-col gap-3 rounded-xl border border-marron-100 bg-white p-4 sm:flex-row sm:items-center"
          >
            {/* Conserva la categoría y el estado de oferta al buscar/ordenar. */}
            {categoria && <input type="hidden" name="categoria" value={categoria} />}
            {oferta && <input type="hidden" name="oferta" value="1" />}

            <input
              type="search"
              name="busqueda"
              defaultValue={busqueda ?? ""}
              placeholder="Buscar producto…"
              className="flex-1 rounded-full border border-marron-200 px-4 py-2 text-sm outline-none focus:border-marron-500"
            />
            <div className="flex items-center gap-2">
              <select
                name="orden"
                defaultValue={orden}
                className="flex-1 rounded-full border border-marron-200 bg-white px-3 py-2 text-sm outline-none focus:border-marron-500 sm:flex-none"
              >
                <option value="relevancia">Relevancia</option>
                <option value="precio-asc">Precio: menor a mayor</option>
                <option value="precio-desc">Precio: mayor a menor</option>
                <option value="nombre">Nombre A-Z</option>
              </select>
              <button
                type="submit"
                className="rounded-full bg-marron-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-marron-800"
              >
                Aplicar
              </button>
            </div>
          </form>

          {/* ============ CUADRÍCULA DE PRODUCTOS ============ */}
          {productos.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {productos.map((p) => (
                <TarjetaProducto key={p.id} producto={p} />
              ))}
            </div>
          ) : (
            // Estado vacío cuando no hay resultados.
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-marron-200 bg-white py-16 text-center">
              <span className="text-4xl">🤠</span>
              <p className="text-lg font-medium text-marron-800">No encontramos productos</p>
              <p className="text-sm text-marron-500">Prueba con otra búsqueda o categoría.</p>
              <Link href="/catalogo" className="mt-2 rounded-full bg-marron-700 px-5 py-2 text-sm font-semibold text-white">
                Limpiar filtros
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
