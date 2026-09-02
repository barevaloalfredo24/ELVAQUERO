// =====================================================================
// SELECTOR DE PRODUCTO (talla, color, cantidad y agregar al carrito)
// ---------------------------------------------------------------------
// Componente cliente que gestiona la elección de variante y añade el
// producto al carrito (contexto global). Recibe el producto completo
// como prop desde la página de detalle (componente de servidor).
// =====================================================================

"use client";

import { useMemo, useState } from "react";
import type { Producto } from "@/lib/tipos";
import { useCarrito } from "@/lib/contexto/carrito";
import { useAuth } from "@/lib/contexto/auth";
import { formatearPrecio } from "@/lib/util";

export function SelectorProducto({ producto }: { producto: Producto }) {
  const { agregar } = useCarrito();
  const { esStaff } = useAuth();

  // Listas únicas de tallas y colores derivadas de las variantes.
  const tallas = useMemo(
    () => Array.from(new Set(producto.variantes.map((v) => v.talla))),
    [producto],
  );
  const colores = useMemo(
    () => Array.from(new Set(producto.variantes.map((v) => v.color))),
    [producto],
  );

  // Estado de selección.
  const [talla, setTalla] = useState(tallas[0] ?? "");
  const [color, setColor] = useState(colores[0] ?? "");
  const [cantidad, setCantidad] = useState(1);
  const [mensaje, setMensaje] = useState("");

  // Variante seleccionada (coincidencia exacta o fallback a la primera).
  const variante = useMemo(() => {
    return (
      producto.variantes.find((v) => v.talla === talla && v.color === color) ??
      producto.variantes.find((v) => v.talla === talla) ??
      producto.variantes[0]
    );
  }, [producto, talla, color]);

  // Si no hay variantes no se puede comprar.
  if (!variante) return null;

  const agotado = variante.stock <= 0;

  // Añade el producto al carrito con una "foto" (snapshot) de sus datos.
  function agregarAlCarrito() {
    if (agotado) return;
    agregar(
      {
        productoId: producto.id,
        varianteId: variante!.id,
        nombre: producto.nombre,
        talla: variante!.talla,
        color: variante!.color,
        precioUnitario: variante!.precio,
        imagen: producto.imagenes?.[0]?.url,
      },
      cantidad,
    );
    // Mensaje temporal de confirmación.
    setMensaje("¡Producto agregado al carrito!");
    window.setTimeout(() => setMensaje(""), 2500);
  }

  return (
    <div className="space-y-4">
      {/* Selector de talla. */}
      <div>
        <p className="mb-2 text-sm font-medium text-marron-700">
          Talla: <span className="font-semibold">{talla}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {tallas.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTalla(t)}
              className={`min-w-12 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                talla === t
                  ? "border-marron-700 bg-marron-700 text-white"
                  : "border-marron-200 bg-white text-marron-800 hover:border-marron-400"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Selector de color. */}
      <div>
        <p className="mb-2 text-sm font-medium text-marron-700">
          Color: <span className="font-semibold">{color}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {colores.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                color === c
                  ? "border-marron-700 bg-marron-700 text-white"
                  : "border-marron-200 bg-white text-marron-800 hover:border-marron-400"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Stock de la variante seleccionada. */}
      <p className={`text-sm ${agotado ? "font-semibold text-red-600" : "text-marron-500"}`}>
        {agotado ? "Agotado" : `${variante.stock} disponibles`}
      </p>

      {/* Cantidad + botón agregar (oculto para staff). */}
      {esStaff ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Los usuarios de staff no pueden agregar productos al carrito.
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-lg border border-marron-200 bg-white">
            <button
              type="button"
              onClick={() => setCantidad((n) => Math.max(1, n - 1))}
              className="px-3 py-2 text-lg font-bold text-marron-600 hover:bg-marron-50"
              aria-label="Disminuir cantidad"
            >
              −
            </button>
            <span className="w-8 text-center font-semibold">{cantidad}</span>
            <button
              type="button"
              onClick={() => setCantidad((n) => Math.min(variante.stock, n + 1))}
              className="px-3 py-2 text-lg font-bold text-marron-600 hover:bg-marron-50"
              aria-label="Aumentar cantidad"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={agregarAlCarrito}
            disabled={agotado}
            className="flex-1 rounded-full bg-marron-700 px-6 py-3 font-semibold text-white transition hover:bg-marron-800 disabled:cursor-not-allowed disabled:bg-marron-300"
          >
            Agregar al carrito · {formatearPrecio(variante.precio * cantidad)}
          </button>
        </div>
      )}

      {/* Mensaje de confirmación. */}
      {mensaje && (
        <p className="rounded-lg bg-green-100 px-3 py-2 text-sm font-medium text-green-800">
          {mensaje}
        </p>
      )}
    </div>
  );
}
