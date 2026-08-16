// =====================================================================
// PÁGINA ADMIN: PEDIDOS
// ---------------------------------------------------------------------
// Componente de servidor que lista las órdenes con su estado, método de
// pago y total. En el backend, el estado cambiará según el webhook de
// Stripe o el avance logístico.
// =====================================================================

import { obtenerPedidos } from "@/lib/servicios/admin";
import { formatearFecha, formatearPrecio } from "@/lib/util";
import { InsigniaEstado } from "@/components/admin/AdminUtil";

export default async function PaginaPedidos() {
  const pedidos = await obtenerPedidos();

  return (
    <div className="space-y-4">
      <p className="text-sm text-marron-500">{pedidos.length} pedidos registrados</p>

      {/* Lista de pedidos (tarjetas apiladas, legibles en móvil). */}
      <div className="space-y-3">
        {pedidos.map((o) => (
          <div key={o.id} className="rounded-xl border border-marron-100 bg-white p-4 shadow-sm">
            {/* Fila superior: id, fecha y estado. */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-semibold text-marron-900">{o.id}</span>
                <span className="ml-2 text-sm text-marron-500">{formatearFecha(o.fecha)}</span>
              </div>
              <InsigniaEstado estado={o.estado} />
            </div>

            {/* Cliente y método de pago. */}
            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-marron-600">
              <span>👤 {o.clienteNombre}</span>
              <span>📧 {o.clienteEmail}</span>
              <span>💳 {o.metodoPago === "tarjeta" ? "Tarjeta" : "Contra entrega"}</span>
              <span>📞 {o.telefono}</span>
            </div>

            {/* Dirección de envío. */}
            <p className="mt-2 text-sm text-marron-500">📍 {o.direccionEnvio}</p>

            {/* Artículos y total. */}
            <div className="mt-3 border-t border-marron-50 pt-3">
              <ul className="space-y-1 text-sm text-marron-600">
                {o.items.map((l, i) => (
                  <li key={i} className="flex justify-between gap-2">
                    <span>
                      {l.nombre} <span className="text-marron-400">×{l.cantidad}</span>
                      <span className="ml-2 text-xs text-marron-400">{l.variante}</span>
                    </span>
                    <span className="font-medium">{formatearPrecio(l.subtotal)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex justify-between border-t border-marron-50 pt-2 font-semibold text-marron-900">
                <span>Total (envío incluido)</span>
                <span>{formatearPrecio(o.total)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
