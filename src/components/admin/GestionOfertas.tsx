// =====================================================================
// GESTIÓN DE OFERTAS POR PRODUCTO (cliente)
// ---------------------------------------------------------------------
// Permite asignar un porcentaje de descuento individual a cada producto.
// Incluye un buscador difuso (tolera errores) para encontrar productos.
// El descuento se muestra como insignia en la tarjeta del producto.
// =====================================================================

"use client";

import { useState } from "react";
import { useAuth } from "@/lib/contexto/auth";
import { peticionAuth } from "@/lib/api";
import { filtrarPorBusqueda } from "@/lib/busqueda";
import { formatearPrecio } from "@/lib/util";
import type { Producto } from "@/lib/tipos";

export function GestionOfertas({ productos }: { productos: Producto[] }) {
  const { token, autenticado, esAdmin } = useAuth();

  const [busqueda, setBusqueda] = useState("");
  const [valores, setValores] = useState<Record<string, string>>({});
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState<string | null>(null);

  if (!autenticado || !esAdmin) return null;

  const filtrados = filtrarPorBusqueda(productos, busqueda, (p) => p.nombre);

  // Guarda el descuento de un producto.
  async function guardarDescuento(p: Producto) {
    const valor = valores[p.id]?.trim() ?? "";
    const numero = Number(valor);
    if (valor !== "" && (Number.isNaN(numero) || numero < 0 || numero > 100)) {
      setMensaje("El porcentaje debe ser un número entre 0 y 100.");
      return;
    }
    setGuardando(p.id);
    setMensaje("");
    const resultado = await peticionAuth(`/api/admin/productos/${p.id}`, token!, {
      method: "PATCH",
      body: JSON.stringify({ descuentoPorcentaje: valor === "" ? 0 : numero }),
    });
    setGuardando(null);
    if (resultado.ok) {
      setMensaje(
        numero > 0
          ? `Oferta del ${numero}% aplicada a "${p.nombre}".`
          : `Oferta removida de "${p.nombre}".`,
      );
      // Refleja el nuevo valor localmente.
      p.descuentoActivo = valor === "" ? null : numero;
      setValores((prev) => ({ ...prev, [p.id]: valor === "" ? "" : String(numero) }));
    } else {
      setMensaje(resultado.mensaje ?? "No se pudo guardar la oferta.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-marron-900">
            Ofertas por producto
          </h2>
          <p className="text-sm text-marron-500">
            Asigna un porcentaje de descuento individual a cada producto (se muestra en su tarjeta).
          </p>
        </div>
      </div>

      {/* Buscador difuso. */}
      <input
        type="search"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar producto para ofertar (tolera errores)…"
        className="w-full max-w-md rounded-full border border-marron-200 bg-white px-4 py-2 text-sm outline-none focus:border-marron-500"
      />

      {mensaje && (
        <p className="rounded-lg bg-green-100 px-3 py-2 text-sm font-medium text-green-800">{mensaje}</p>
      )}

      <div className="overflow-x-auto rounded-xl border border-marron-100 bg-white shadow-sm">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-marron-100 bg-marron-50 text-xs uppercase tracking-wide text-marron-500">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Oferta actual</th>
              <th className="px-4 py-3">Nuevo %</th>
              <th className="px-4 py-3">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-marron-50">
            {filtrados.map((p) => (
              <tr key={p.id} className="hover:bg-marron-50/50">
                <td className="px-4 py-3 font-medium text-marron-900">{p.nombre}</td>
                <td className="px-4 py-3 text-marron-600">{formatearPrecio(p.precio)}</td>
                <td className="px-4 py-3">
                  {p.descuentoActivo ? (
                    <span className="rounded-full bg-dorado px-2.5 py-1 text-xs font-bold text-marron-950">
                      -{p.descuentoActivo}%
                    </span>
                  ) : (
                    <span className="text-marron-400">Sin oferta</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={valores[p.id] ?? (p.descuentoActivo ? String(p.descuentoActivo) : "")}
                    onChange={(e) => setValores((prev) => ({ ...prev, [p.id]: e.target.value }))}
                    placeholder="0"
                    className="w-20 rounded-lg border border-marron-200 px-2 py-1.5 outline-none focus:border-marron-500"
                  />
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => guardarDescuento(p)}
                    disabled={guardando === p.id}
                    className="rounded-full bg-marron-700 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-marron-800 disabled:opacity-60"
                  >
                    {guardando === p.id ? "Guardando…" : "Guardar"}
                  </button>
                </td>
              </tr>
            ))}
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
