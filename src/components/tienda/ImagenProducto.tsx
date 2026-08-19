// =====================================================================
// IMAGEN DE PRODUCTO
// ---------------------------------------------------------------------
// Si el producto tiene imágenes (Cloudinary), muestra la primera. Si no,
// pinta un bloque de color con el emoji de su categoría como respaldo.
// =====================================================================

import type { Producto } from "@/lib/tipos";
import { emojiCategoria } from "@/lib/emoji";

// Gradiente de color asociado a cada categoría (por slug), para el fallback.
const gradientes: Record<string, string> = {
  botas: "from-marron-600 to-marron-900",
  sombreros: "from-amber-500 to-marron-700",
  cinturones: "from-stone-500 to-marron-800",
  camisas: "from-marron-400 to-marron-700",
  pantalones: "from-blue-900 to-slate-700",
  accesorios: "from-dorado to-marron-600",
};

export function ImagenProducto({ producto }: { producto: Producto }) {
  const url = producto.imagenes?.[0]?.url;

  // Si hay imagen real, se muestra (Cloudinary la sirve optimizada vía CDN).
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={producto.nombre}
        className="aspect-[4/3] w-full object-cover"
      />
    );
  }

  const gradiente = gradientes[producto.categoriaSlug ?? ""] ?? "from-marron-500 to-marron-800";

  return (
    <div
      className={`relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-gradient-to-br ${gradiente}`}
      role="img"
      aria-label={producto.nombre}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
      <span className="text-6xl drop-shadow-lg sm:text-7xl">
        {emojiCategoria(producto.categoriaSlug)}
      </span>
    </div>
  );
}
