// =====================================================================
// PÁGINA DE DETALLE DE PRODUCTO
// ---------------------------------------------------------------------
// Componente de servidor: carga el producto por id, sus relacionados y
// renderiza la ficha. El bloque interactivo (talla/color/carrito) se
// delega en un componente cliente <SelectorProducto />.
// =====================================================================

import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  obtenerProductoPorId,
  obtenerProductos,
  obtenerProductosRelacionados,
} from "@/lib/servicios/catalogo";
import { formatearPrecio } from "@/lib/util";
import { ImagenProducto } from "@/components/tienda/ImagenProducto";
import { SelectorProducto } from "@/components/tienda/SelectorProducto";
import { BotonDeseo } from "@/components/tienda/BotonDeseo";
import { TarjetaProducto } from "@/components/tienda/TarjetaProducto";
import { ResenasProducto } from "@/components/tienda/ResenasProducto";

// Pre-genera las páginas de todos los productos en el build (SSG).
export async function generateStaticParams() {
  const productos = await obtenerProductos();
  return productos.map((p) => ({ id: p.id }));
}

// Metadatos dinámicos por producto (SEO).
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const producto = await obtenerProductoPorId(id);
  return { title: producto?.nombre ?? "Producto no encontrado" };
}

export default async function PaginaProducto({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Carga el producto; si no existe, devuelve 404.
  const producto = await obtenerProductoPorId(id);
  if (!producto) notFound();

  const relacionados = await obtenerProductosRelacionados(producto.categoriaId, producto.id);

  return (
    <div className="contenedor py-8">
      {/* Migas de pan (breadcrumb). */}
      <nav className="mb-6 text-sm text-marron-500">
        <Link href="/" className="hover:text-marron-800">Inicio</Link>
        <span className="mx-1">/</span>
        <Link href="/catalogo" className="hover:text-marron-800">Catálogo</Link>
        {producto.categoriaSlug && (
          <>
            <span className="mx-1">/</span>
            <Link href={`/catalogo?categoria=${producto.categoriaSlug}`} className="hover:text-marron-800">
              {producto.categoriaNombre}
            </Link>
          </>
        )}
        <span className="mx-1">/</span>
        <span className="text-marron-800">{producto.nombre}</span>
      </nav>

      {/* Ficha del producto: imagen + información. */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Columna de imagen. */}
        <div className="overflow-hidden rounded-2xl border border-marron-100 bg-white shadow-sm">
          <ImagenProducto producto={producto} />
        </div>

        {/* Columna de información. */}
        <div className="flex flex-col gap-4">
          <div>
            <span className="text-sm font-medium uppercase tracking-wide text-marron-500">
              {producto.categoriaNombre}
            </span>
            <h1 className="mt-1 font-display text-3xl font-bold text-marron-900">
              {producto.nombre}
            </h1>
            {/* Calificación. */}
            <div className="mt-2 flex items-center gap-2 text-sm text-marron-500">
              <span className="text-dorado">★</span>
              <span className="font-medium">{producto.calificacion.toFixed(1)}</span>
              <span>· {producto.numResenas} reseñas</span>
              <BotonDeseo productoId={producto.id} />
            </div>
          </div>

          {/* Precio. */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-marron-800">
              {formatearPrecio(producto.precio)}
            </span>
            {producto.precioAnterior && (
              <span className="text-lg text-marron-400 line-through">
                {formatearPrecio(producto.precioAnterior)}
              </span>
            )}
            {producto.enOferta && (
              <span className="rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold text-white">
                Oferta
              </span>
            )}
          </div>

          {/* Descripción. */}
          <p className="leading-relaxed text-marron-700">{producto.descripcion}</p>

          {/* Selector interactivo de variante + carrito. */}
          <SelectorProducto producto={producto} />

          {/* Notas de beneficio. */}
          <div className="mt-2 space-y-2 rounded-xl bg-marron-50 p-4 text-sm text-marron-700">
            <p>🚚 Envío a toda Guatemala · Gratis en pedidos mayores a Q500</p>
            <p>💵 Pago contra entrega disponible</p>
            <p>↩️ Garantía de devolución de 7 días</p>
          </div>
        </div>
      </div>

      {/* Reseñas y calificación (clientes). */}
      <ResenasProducto productoId={producto.id} />

      {/* Productos relacionados. */}
      {relacionados.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-6 font-display text-2xl font-bold text-marron-900">
            También te puede interesar
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {relacionados.map((p) => (
              <TarjetaProducto key={p.id} producto={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
