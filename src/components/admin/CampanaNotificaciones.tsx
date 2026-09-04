// =====================================================================
// CAMPANA DE NOTIFICACIONES (admin/staff)
// ---------------------------------------------------------------------
// Muestra un contador de notificaciones no leídas (pedidos nuevos, stock
// bajo) y un desplegable con el detalle. Consulta cada 30 segundos.
// =====================================================================

"use client";

import { useEffect, useRef, useState } from "react";
import { obtenerNotificaciones, marcarNotificacionesLeidas } from "@/lib/servicios/admin";
import { formatearFecha } from "@/lib/util";
import type { Notificacion } from "@/lib/tipos";

// Ícono + color por tipo de notificación.
const TIPOS: Record<Notificacion["tipo"], { icono: string; color: string }> = {
  nueva_orden: { icono: "📦", color: "bg-blue-100 text-blue-700" },
  stock_bajo: { icono: "⚠️", color: "bg-amber-100 text-amber-700" },
  pago_fallido: { icono: "💳", color: "bg-red-100 text-red-700" },
  nueva_resena: { icono: "⭐", color: "bg-green-100 text-green-700" },
};

export function CampanaNotificaciones() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const noLeidas = notificaciones.filter((n) => !n.estaLeida).length;

  useEffect(() => {
    void obtenerNotificaciones().then(setNotificaciones);
    const id = setInterval(() => void obtenerNotificaciones().then(setNotificaciones), 30000);
    return () => clearInterval(id);
  }, []);

  // Cierra el desplegable al hacer clic fuera.
  useEffect(() => {
    function manejarClic(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener("mousedown", manejarClic);
    return () => document.removeEventListener("mousedown", manejarClic);
  }, []);

  async function marcarLeidas() {
    await marcarNotificacionesLeidas();
    void obtenerNotificaciones().then(setNotificaciones);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-label="Notificaciones"
        className="relative rounded-md p-2 text-marron-700 hover:bg-marron-100"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {noLeidas > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
            {noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-marron-100 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-marron-100 px-4 py-2.5">
            <span className="font-semibold text-marron-900">Notificaciones</span>
            {noLeidas > 0 && (
              <button
                type="button"
                onClick={marcarLeidas}
                className="text-xs font-medium text-marron-600 hover:underline"
              >
                Marcar leídas
              </button>
            )}
          </div>
          <ul className="max-h-80 overflow-auto">
            {notificaciones.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-marron-500">
                No hay notificaciones.
              </li>
            ) : (
              notificaciones.map((n) => {
                const t = TIPOS[n.tipo] ?? { icono: "🔔", color: "bg-gray-100 text-gray-700" };
                return (
                  <li
                    key={n.id}
                    className={`flex items-start gap-3 border-b border-marron-50 px-4 py-3 text-sm ${
                      n.estaLeida ? "opacity-70" : ""
                    }`}
                  >
                    <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${t.color}`}>
                      {t.icono}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-marron-800">{n.mensaje}</span>
                      <span className="text-xs text-marron-400">{formatearFecha(n.fechaCreacion)}</span>
                    </span>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
