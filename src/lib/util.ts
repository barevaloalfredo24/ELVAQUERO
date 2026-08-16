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

// Simula la latencia de una llamada a la API.
// Se mantiene en 0ms durante el desarrollo para una experiencia fluida;
// cuando exista backend real, estos métodos se sustituirán por fetch().
export function simularLatencia<T>(valor: T): Promise<T> {
  return Promise.resolve(valor);
}
