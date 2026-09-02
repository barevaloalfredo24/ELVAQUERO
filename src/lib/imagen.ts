// =====================================================================
// UTILIDAD DE IMAGEN (compresión/redimensionado en el navegador)
// ---------------------------------------------------------------------
// Redimensiona y recorta las imágenes antes de subirlas para que todas
// queden del mismo tamaño (4:3, 1200x900) y con un peso reducido.
// Usa <img> + FileReader para ser compatible con iOS/HEIC/Safari.
// =====================================================================

const ANCHO = 1200;
const ALTO = 900; // proporción 4:3
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

// Redimensiona, recorta al centro (4:3) y comprime la imagen a JPEG.
export async function comprimirImagen(archivo: File): Promise<Blob> {
  const dataUrl = await leerComoDataUrl(archivo);
  const imagen = await cargarImagen(dataUrl);

  const { naturalWidth: w, naturalHeight: h } = imagen;
  const proporcionObjetivo = ANCHO / ALTO;
  const proporcionFuente = w / h;

  // Recorte central a 4:3.
  let sx = 0;
  let sy = 0;
  let sw = w;
  let sh = h;
  if (proporcionFuente > proporcionObjetivo) {
    sw = h * proporcionObjetivo;
    sx = (w - sw) / 2;
  } else {
    sh = w / proporcionObjetivo;
    sy = (h - sh) / 2;
  }

  const canvas = document.createElement("canvas");
  canvas.width = ANCHO;
  canvas.height = ALTO;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen.");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = "#ffffff"; // fondo blanco por si hay transparencia
  ctx.fillRect(0, 0, ANCHO, ALTO);
  ctx.drawImage(imagen, sx, sy, sw, sh, 0, 0, ANCHO, ALTO);

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
