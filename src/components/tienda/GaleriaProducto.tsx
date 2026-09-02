// =====================================================================
// GALERÍA DE PRODUCTO (cliente)
// ---------------------------------------------------------------------
// Muestra la foto principal y, si hay más imágenes, miniaturas (hasta 4
// totales) que al hacer clic pasan a mostrarse en grande. En escritorio
// las miniaturas van al costado (columna); en móvil, debajo. Si no hay
// imágenes, pinta un bloque de color sólido (respaldo accesible con alt).
// =====================================================================

"use client";

import { useState } from "react";
import type { Producto } from "@/lib/tipos";
import { urlImagen } from "@/lib/cloudinary";

const colores: Record<string, string> = {
  botas: "bg-marron-700",
  sombreros: "bg-amber-600",
  cinturones: "bg-stone-600",
  camisas: "bg-marron-600",
  pantalones: "bg-slate-700",
  accesorios: "bg-amber-700",
};

export function GaleriaProducto({ producto }: { producto: Producto }) {
  const [activo, setActivo] = useState(0);
  const imagenes = producto.imagenes ?? [];

  // Sin imágenes: respaldo de color sólido.
  if (imagenes.length === 0) {
    const color = colores[producto.categoriaSlug ?? ""] ?? "bg-marron-600";
    return (
      <div
        className={`flex aspect-[4/3] w-full items-center justify-center rounded-2xl ${color}`}
        role="img"
        aria-label={producto.nombre}
      />
    );
  }

  const indice = Math.min(activo, imagenes.length - 1);
  const principal = imagenes[indice];
  const miniaturas = imagenes.slice(0, 4);

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {/* Miniaturas (columna al costado en escritorio, fila en móvil). */}
      {miniaturas.length > 1 && (
        <div className="flex gap-2 sm:flex-col sm:gap-3">
          {miniaturas.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActivo(i)}
              aria-label={`Ver imagen ${i + 1}`}
              className={`shrink-0 overflow-hidden rounded-lg border-2 transition ${
                i === indice
                  ? "border-marron-700"
                  : "border-transparent hover:border-marron-300"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={urlImagen(img.url, 160)}
                alt={`${producto.nombre} ${i + 1}`}
                className="h-20 w-20 object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Foto principal. */}
      <div className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-marron-100 bg-white shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={urlImagen(principal.url, 1000)}
          alt={producto.nombre}
          className="aspect-[4/3] w-full object-cover"
        />
      </div>
    </div>
  );
}
