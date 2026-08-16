// =====================================================================
// IMAGEN DE PRODUCTO (marcador de posición)
// ---------------------------------------------------------------------
// Mientras no exista backend con imágenes reales (Cloudinary / S3),
// este componente pinta un bloque de color con el emoji de la categoría.
// Cuando lleguen las URLs, bastará sustituir este <div> por un
// <Image src={producto.imagenes[0]} ... /> sin tocar el resto del layout.
// =====================================================================

import type { Producto } from "@/lib/tipos";
import { categoriaDe } from "@/lib/servicios/catalogo";

// Gradiente de color asociado a cada categoría para dar variedad visual.
const gradientes: Record<string, string> = {
  "cat-botas": "from-marron-600 to-marron-900",
  "cat-sombreros": "from-amber-500 to-marron-700",
  "cat-cinturones": "from-stone-500 to-marron-800",
  "cat-camisas": "from-marron-400 to-marron-700",
  "cat-pantalones": "from-blue-900 to-slate-700",
  "cat-accesorios": "from-dorado to-marron-600",
};

export function ImagenProducto({ producto }: { producto: Producto }) {
  const categoria = categoriaDe(producto);
  const gradiente = gradientes[producto.categoriaId] ?? "from-marron-500 to-marron-800";

  return (
    <div
      className={`relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-gradient-to-br ${gradiente}`}
      role="img"
      aria-label={producto.nombre}
    >
      {/* Textura sutil de líneas para dar profundidad. */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
      {/* Emoji representativo de la categoría. */}
      <span className="text-6xl drop-shadow-lg sm:text-7xl">{categoria?.icono ?? "🧺"}</span>
    </div>
  );
}
