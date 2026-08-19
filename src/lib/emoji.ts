// =====================================================================
// EMOJIS DE CATEGORÍA
// ---------------------------------------------------------------------
// La base de datos no almacena un "icono" por categoría, así que se
// deriva un emoji a partir del slug. Se usa en el menú, la portada y
// el marcador de posición de imagen de los productos.
// =====================================================================

const EMOJIS: Record<string, string> = {
  botas: "👢",
  sombreros: "🤠",
  cinturones: "🐂",
  camisas: "👔",
  pantalones: "👖",
  accesorios: "🧤",
};

// Devuelve el emoji asociado a una categoría, con un valor por defecto.
export function emojiCategoria(slug?: string | null): string {
  return (slug && EMOJIS[slug]) || "🧺";
}
