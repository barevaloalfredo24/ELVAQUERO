// =====================================================================
// UTILIDADES GENERALES
// =====================================================================

// Formatea un número como moneda guatemalteca (Quetzales).
// Ejemplo: 1250 -> "Q 1,250.00"
export function formatearPrecio(valor: number): string {
  return new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    minimumFractionDigits: 2,
  }).format(valor);
}

// Formatea una fecha ISO a un texto legible en español.
export function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString("es-GT", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Aplica un descuento porcentual a un precio (0..100).
export function precioConDescuento(
  precio: number,
  descuento: number | null | undefined,
): number {
  const d = Number(descuento ?? 0);
  if (d <= 0) return precio;
  return Math.round(precio * (1 - d / 100) * 100) / 100;
}

// Simula la latencia de una llamada a la API.
// Se mantiene en 0ms durante el desarrollo para una experiencia fluida;
// cuando exista backend real, estos métodos se sustituirán por fetch().
export function simularLatencia<T>(valor: T): Promise<T> {
  return Promise.resolve(valor);
}
