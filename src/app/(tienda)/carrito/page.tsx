// =====================================================================
// PÁGINA DEL CARRITO DE COMPRAS
// ---------------------------------------------------------------------
// Componente cliente: muestra las líneas del carrito, permite cambiar
// cantidades o eliminar productos y calcula el resumen de la compra.
// =====================================================================

"use client";

import Link from "next/link";
import { useCarrito } from "@/lib/contexto/carrito";
import { formatearPrecio } from "@/lib/util";

// Costo fijo de envío y umbral de envío gratis.
const ENVIO = 45;
const UMBRAL_ENVIO_GRATIS = 500;

export default function PaginaCarrito() {
  const { lineas, cantidadTotal, subtotal, actualizarCantidad, eliminar, vaciar } = useCarrito();

  // Calcula el costo de envío según el umbral.
  const envio = subtotal === 0 || subtotal >= UMBRAL_ENVIO_GRATIS ? 0 : ENVIO;
  const total = subtotal + envio;

  // Estado vacío.
  if (lineas.length === 0) {
    return (
      <div className="contenedor flex flex-col items-center gap-4 py-20 text-center">
        <span className="text-6xl">🛒</span>
        <h1 className="font-display text-2xl font-bold text-marron-900">Tu carrito está vacío</h1>
        <p className="text-marron-500">Explora el catálogo y agrega tus productos favoritos.</p>
        <Link
          href="/catalogo"
          className="mt-2 rounded-full bg-marron-700 px-6 py-3 font-semibold text-white transition hover:bg-marron-800"
        >
          Ir al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="contenedor py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-marron-900 sm:text-3xl">
          Mi carrito <span className="text-lg font-normal text-marron-500">({cantidadTotal})</span>
        </h1>
        <button
          type="button"
          onClick={vaciar}
          className="text-sm font-medium text-red-600 hover:underline"
        >
          Vaciar carrito
        </button>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Lista de productos. */}
        <div className="flex-1 space-y-3">
          {lineas.map((l) => (
            <div
              key={`${l.productoId}-${l.varianteId}`}
              className="flex items-center gap-4 rounded-xl border border-marron-100 bg-white p-4"
            >
              {/* Miniatura de marcador de posición. */}
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-marron-200 to-marron-400 text-2xl">
                🧺
              </div>

              {/* Información del producto. */}
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-medium text-marron-900">{l.nombre}</h3>
                <p className="text-sm text-marron-500">
                  Talla {l.talla} · {l.color}
                </p>
                <p className="mt-1 font-semibold text-marron-800">
                  {formatearPrecio(l.precioUnitario)}
                </p>
              </div>

              {/* Control de cantidad. */}
              <div className="flex items-center rounded-lg border border-marron-200">
                <button
                  type="button"
                  onClick={() => actualizarCantidad(l.productoId, l.varianteId, l.cantidad - 1)}
                  className="px-3 py-1.5 text-lg font-bold text-marron-600 hover:bg-marron-50"
                  aria-label="Disminuir"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-semibold">{l.cantidad}</span>
                <button
                  type="button"
                  onClick={() => actualizarCantidad(l.productoId, l.varianteId, l.cantidad + 1)}
                  className="px-3 py-1.5 text-lg font-bold text-marron-600 hover:bg-marron-50"
                  aria-label="Aumentar"
                >
                  +
                </button>
              </div>

              {/* Subtotal de la línea y botón eliminar. */}
              <div className="flex flex-col items-end gap-1">
                <span className="font-semibold text-marron-900">
                  {formatearPrecio(l.precioUnitario * l.cantidad)}
                </span>
                <button
                  type="button"
                  onClick={() => eliminar(l.productoId, l.varianteId)}
                  className="text-xs font-medium text-red-500 hover:underline"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Resumen de la compra. */}
        <aside className="lg:w-80">
          <div className="sticky top-28 space-y-3 rounded-xl border border-marron-100 bg-white p-5 shadow-sm">
            <h2 className="font-display text-lg font-bold text-marron-900">Resumen</h2>
            <div className="space-y-2 border-b border-marron-100 pb-3 text-sm">
              <div className="flex justify-between">
                <span className="text-marron-500">Subtotal</span>
                <span className="font-medium">{formatearPrecio(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-marron-500">Envío</span>
                <span className="font-medium">
                  {envio === 0 ? "Gratis" : formatearPrecio(envio)}
                </span>
              </div>
              {envio > 0 && (
                <p className="text-xs text-marron-400">
                  Agrega {formatearPrecio(UMBRAL_ENVIO_GRATIS - subtotal)} para envío gratis.
                </p>
              )}
            </div>
            <div className="flex justify-between text-lg font-bold text-marron-900">
              <span>Total</span>
              <span>{formatearPrecio(total)}</span>
            </div>
            <Link
              href="/checkout"
              className="block rounded-full bg-marron-700 py-3 text-center font-semibold text-white transition hover:bg-marron-800"
            >
              Proceder al pago
            </Link>
            <Link
              href="/catalogo"
              className="block rounded-full border border-marron-200 py-3 text-center font-medium text-marron-700 transition hover:bg-marron-50"
            >
              Seguir comprando
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
