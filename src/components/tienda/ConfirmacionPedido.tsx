// =====================================================================
// CONFIRMACIÓN DE PEDIDO (cliente)
// ---------------------------------------------------------------------
// Recibe el id de la orden y muestra el resumen final leyendo el
// historial local de pedidos.
// =====================================================================

"use client";

import Link from "next/link";
import { useAlmacenLocal } from "@/lib/hooks/use-almacen-local";
import { formatearPrecio } from "@/lib/util";
import type { Orden } from "@/lib/tipos";

const CLAVE_ORDENES = "elvaquero-ordenes";
const ORDENES_VACIAS: Orden[] = [];

export function ConfirmacionPedido({ ordenId }: { ordenId?: string }) {
  // Lee las órdenes locales y busca la que coincide con el id.
  const [ordenes] = useAlmacenLocal<Orden[]>(CLAVE_ORDENES, ORDENES_VACIAS);
  const orden = ordenes.find((o) => o.id === ordenId) ?? ordenes[0] ?? null;

  return (
    <div className="contenedor flex flex-col items-center gap-4 py-16 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-4xl">
        ✅
      </span>
      <h1 className="font-display text-2xl font-bold text-marron-900 sm:text-3xl">
        ¡Gracias por tu compra!
      </h1>
      <p className="max-w-md text-marron-500">
        Tu pedido ha sido registrado. Recibirás un correo de confirmación con los detalles.
      </p>

      {orden && (
        <div className="w-full max-w-md rounded-xl border border-marron-100 bg-white p-5 text-left shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-semibold text-marron-900">{orden.id}</span>
            <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
              {orden.metodoPago === "tarjeta" ? "Pago con tarjeta" : "Pago contra entrega"}
            </span>
          </div>
          <ul className="space-y-1 border-b border-marron-100 pb-3 text-sm text-marron-600">
            {orden.items.map((l, i) => (
              <li key={i} className="flex justify-between gap-2">
                <span>
                  {l.nombre} <span className="text-marron-400">×{l.cantidad}</span>
                </span>
                <span>{formatearPrecio(l.subtotal)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 flex justify-between text-lg font-bold text-marron-900">
            <span>Total</span>
            <span>{formatearPrecio(orden.total)}</span>
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <Link
          href="/catalogo"
          className="rounded-full bg-marron-700 px-6 py-3 font-semibold text-white transition hover:bg-marron-800"
        >
          Seguir comprando
        </Link>
        <Link
          href="/cuenta"
          className="rounded-full border border-marron-200 px-6 py-3 font-medium text-marron-700 transition hover:bg-marron-50"
        >
          Ver mis pedidos
        </Link>
      </div>
    </div>
  );
}
