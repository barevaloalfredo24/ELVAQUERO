// =====================================================================
// TABLA DE INVENTARIO (cliente)
// ---------------------------------------------------------------------
// Muestra la tabla de inventario con semáforo de stock y un buscador
// con tolerancia a errores ortográficos.
// =====================================================================

"use client";

import { useState } from "react";
import { filtrarPorBusqueda } from "@/lib/busqueda";
import { formatearPrecio } from "@/lib/util";
import type { Producto } from "@/lib/tipos";

// Clasifica el stock en un semáforo de 3 niveles.
function estadoStock(stock: number, umbral: number) {
  if (stock <= umbral) return { color: "bg-red-500", texto: "text-red-700", etiqueta: "Crítico" };
  if (stock <= umbral * 2) return { color: "bg-amber-500", texto: "text-amber-700", etiqueta: "Bajo" };
  return { color: "bg-green-500", texto: "text-green-700", etiqueta: "Saludable" };
}

export function TablaInventario({ productos }: { productos: Producto[] }) {
  const [busqueda, setBusqueda] = useState("");

  const filtrados = filtrarPorBusqueda(productos, busqueda, (p) => p.nombre);

  return (
    <div className="space-y-3">
      {/* Buscador. */}
      <input
        type="search"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar producto en el inventario (tolera errores)…"
        className="w-full max-w-md rounded-full border border-marron-200 bg-white px-4 py-2 text-sm outline-none focus:border-marron-500"
      />

      {/* Tabla completa de inventario con semáforo. */}
      <div className="overflow-x-auto rounded-xl border border-marron-100 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-marron-100 bg-marron-50 text-xs uppercase tracking-wide text-marron-500">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Umbral</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-marron-50">
            {filtrados.map((p) => {
              const estado = estadoStock(p.stockTotal, p.umbralStock);
              return (
                <tr key={p.id} className="hover:bg-marron-50/50">
                  <td className="px-4 py-3 font-medium text-marron-900">{p.nombre}</td>
                  <td className="px-4 py-3 text-marron-600">{formatearPrecio(p.precio)}</td>
                  <td className="px-4 py-3 font-semibold text-marron-800">{p.stockTotal}</td>
                  <td className="px-4 py-3 text-marron-500">{p.umbralStock}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${estado.color}`} />
                      <span className={`font-medium ${estado.texto}`}>{estado.etiqueta}</span>
                    </span>
                  </td>
                </tr>
              );
            })}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-marron-500">
                  No se encontraron productos para esa búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
