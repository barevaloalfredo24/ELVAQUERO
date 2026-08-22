// =====================================================================
// TARJETA DE PRODUCTO
// ---------------------------------------------------------------------
// Componente de servidor que muestra un producto en la cuadrícula del
// catálogo o de la portada. Enlaza al detalle del producto.
// =====================================================================

import Link from "next/link";
import type { Producto } from "@/lib/tipos";
import { formatearPrecio } from "@/lib/util";
import { ImagenProducto } from "./ImagenProducto";
import { BotonDeseo } from "./BotonDeseo";

export function TarjetaProducto({ producto }: { producto: Producto }) {
  return (
    <div className="relative">
      <Link
        href={`/producto/${producto.id}`}
        className="group flex flex-col overflow-hidden rounded-xl border border-marron-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
      >
        <div className="relative">
          <ImagenProducto producto={producto} />

          {/* Insignia de oferta. */}
          {producto.enOferta && producto.precioAnterior && (
            <span className="absolute left-2 top-2 rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold text-white">
              -{Math.round((1 - producto.precio / producto.precioAnterior) * 100)}%
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1 p-4">
          {/* Categoría. */}
          <span className="text-xs font-medium uppercase tracking-wide text-marron-500">
            {producto.categoriaNombre}
          </span>
          {/* Nombre. */}
          <h3 className="font-medium text-marron-900 group-hover:text-marron-600">
            {producto.nombre}
          </h3>
          {/* Precio. */}
          <div className="mt-auto flex items-baseline gap-2 pt-2">
            <span className="text-lg font-bold text-marron-800">
              {formatearPrecio(producto.precio)}
            </span>
            {producto.precioAnterior && (
              <span className="text-sm text-marron-400 line-through">
                {formatearPrecio(producto.precioAnterior)}
              </span>
            )}
          </div>
          {/* Calificación. */}
          <div className="flex items-center gap-1 text-xs text-marron-500">
            <span className="font-medium text-marron-700">{producto.calificacion.toFixed(1)}</span>
            <span>({producto.numResenas} reseñas)</span>
          </div>
        </div>
      </Link>

      {/* Botón de wishlist (fuera del enlace, sobre la imagen). */}
      <div className="absolute right-2 top-2 z-10">
        <BotonDeseo productoId={producto.id} />
      </div>
    </div>
  );
}
