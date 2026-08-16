// =====================================================================
// UTILIDADES VISUALES DEL PANEL ADMIN
// ---------------------------------------------------------------------
// Pequeños componentes de presentación reutilizados por las páginas del
// panel (tarjetas de estadística e insignias de estado de orden).
// =====================================================================

import type { EstadoOrden } from "@/lib/tipos";

// Tarjeta con un número destacado y su etiqueta.
export function TarjetaEstadistica({
  titulo,
  valor,
  detalle,
  icono,
}: {
  titulo: string;
  valor: string;
  detalle?: string;
  icono: string;
}) {
  return (
    <div className="rounded-xl border border-marron-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-marron-500">{titulo}</span>
        <span className="text-xl">{icono}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-marron-900">{valor}</p>
      {detalle && <p className="mt-1 text-xs text-marron-400">{detalle}</p>}
    </div>
  );
}

// Mapa de estados de orden a su estilo visual.
const ESTILOS_ESTADO: Record<EstadoOrden, string> = {
  pendiente: "bg-blue-100 text-blue-700",
  pago_pendiente: "bg-amber-100 text-amber-700",
  pagada: "bg-green-100 text-green-700",
  enviada: "bg-indigo-100 text-indigo-700",
  entregada: "bg-teal-100 text-teal-700",
  cancelada: "bg-red-100 text-red-700",
};

const ETIQUETAS_ESTADO: Record<EstadoOrden, string> = {
  pendiente: "Pendiente",
  pago_pendiente: "Contra entrega",
  pagada: "Pagada",
  enviada: "Enviada",
  entregada: "Entregada",
  cancelada: "Cancelada",
};

// Insignia de color según el estado de la orden.
export function InsigniaEstado({ estado }: { estado: EstadoOrden }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${ESTILOS_ESTADO[estado] ?? "bg-gray-100 text-gray-700"}`}
    >
      {ETIQUETAS_ESTADO[estado] ?? estado}
    </span>
  );
}
