// =====================================================================
// UTILIDAD DE URL DE CLOUDINARY
// ---------------------------------------------------------------------
// Genera URLs de Cloudinary con transformación de ancho para servir la
// imagen ya redimensionada y optimizada (menos peso = carga más rápida).
// =====================================================================

// Inserta una transformación de ancho (w_XXX) en una URL de Cloudinary.
export function urlImagen(url: string, ancho?: number): string {
  if (!ancho || !url.includes("res.cloudinary.com")) return url;
  const marca = "/image/upload/";
  const idx = url.indexOf(marca);
  if (idx === -1) return url;
  const inicio = idx + marca.length;
  return `${url.slice(0, inicio)}w_${ancho}/` + url.slice(inicio);
}
