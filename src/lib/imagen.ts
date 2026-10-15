// =====================================================================
// UTILIDAD DE IMAGEN (compresión/redimensionado en el navegador)
// ---------------------------------------------------------------------
// Redimensiona las imágenes antes de subirlas (manteniendo la proporción
// original, SIN recortar) para reducir su peso. Usa <img> + FileReader
// para ser compatible con iOS/HEIC/Safari.
// =====================================================================

const MAX_DIMENSION = 1600; // lado más largo máximo (px)
const CALIDAD = 0.8;

// Convierte un File en dataURL (la forma más compatible de decodificar).
function leerComoDataUrl(archivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.readAsDataURL(archivo);
  });
}

// Carga un dataURL en un elemento <img> (decodificación nativa del navegador).
function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo cargar la imagen."));
    img.src = src;
  });
}

// Redimensiona (sin recortar) y comprime la imagen a JPEG.
export async function comprimirImagen(archivo: File): Promise<Blob> {
  const dataUrl = await leerComoDataUrl(archivo);
  const imagen = await cargarImagen(dataUrl);

  const { naturalWidth: w, naturalHeight: h } = imagen;

  // Escala manteniendo la proporción original (el lado más largo <= 1600px).
  const escala = Math.min(1, MAX_DIMENSION / Math.max(w, h));
  const ancho = Math.max(1, Math.round(w * escala));
  const alto = Math.max(1, Math.round(h * escala));

  const canvas = document.createElement("canvas");
  canvas.width = ancho;
  canvas.height = alto;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen.");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = "#ffffff"; // fondo blanco por si hay transparencia
  ctx.fillRect(0, 0, ancho, alto);
  ctx.drawImage(imagen, 0, 0, ancho, alto);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("No se pudo comprimir la imagen."));
      },
      "image/jpeg",
      CALIDAD,
    );
  });
}
