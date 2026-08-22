// =====================================================================
// IMAGEN DE PRODUCTO
// ---------------------------------------------------------------------
// Si el producto tiene imágenes (Cloudinary), muestra la primera. Si no,
// pinta un bloque de color sólido (respaldo accesible con alt).
// =====================================================================

import type { Producto } from "@/lib/tipos";

// Color sólido asociado a cada categoría (por slug), para el fallback.
const colores: Record<string, string> = {
  botas: "bg-marron-700",
  sombreros: "bg-amber-600",
  cinturones: "bg-stone-600",
  camisas: "bg-marron-600",
  pantalones: "bg-slate-700",
  accesorios: "bg-amber-700",
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

  const color = colores[producto.categoriaSlug ?? ""] ?? "bg-marron-600";

  return (
    <div
      className={`flex aspect-[4/3] w-full items-center justify-center ${color}`}
      role="img"
      aria-label={producto.nombre}
    />
  );
}
