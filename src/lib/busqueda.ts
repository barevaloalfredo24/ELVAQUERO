// =====================================================================
// BÚSQUEDA DIFUSA EN EL CLIENTE
// ---------------------------------------------------------------------
// Utilidades para filtrar listas ya cargadas con tolerancia a errores
// ortográficos (distancia de Levenshtein), prefijos y subcadenas, e
// ignorando acentos. Se usa en los paneles de administración.
// =====================================================================

// Quita acentos y convierte a minúsculas para comparar de forma robusta.
export function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Distancia de Levenshtein entre dos cadenas (nº de ediciones).
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const filaAnterior = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const filaActual = [i];
    for (let j = 1; j <= n; j++) {
      const costo = a[i - 1] === b[j - 1] ? 0 : 1;
      filaActual[j] = Math.min(
        filaActual[j - 1] + 1, // inserción
        filaAnterior[j] + 1, // borrado
        filaAnterior[j - 1] + costo, // sustitución
      );
    }
    for (let j = 0; j <= n; j++) filaAnterior[j] = filaActual[j];
  }
  return filaAnterior[n];
}

// Devuelve un puntaje 0..1 que indica cuánto coincide `texto` con `query`.
// 1 = exacto, >0.7 = prefijo/subcadena, ~0.5 = typo cercano, 0 = no coincide.
export function coincidencia(texto: string, query: string): number {
  const t = normalizar(texto);
  const q = normalizar(query.trim());
  if (!q) return 0;

  if (t === q) return 1;
  if (t.startsWith(q)) return 0.95;
  if (t.includes(q)) return 0.8;

  // Coincidencia de prefijo por palabra (ej. "bot" -> "Bota Vaquera").
  const palabras = t.split(/\s+/);
  if (palabras.some((p) => p.startsWith(q))) return 0.75;

  // Tolerancia a errores: mejor similitud de Levenshtein por palabra.
  let mejor = 0;
  for (const palabra of palabras) {
    const dist = levenshtein(palabra, q);
    const maxLen = Math.max(palabra.length, q.length);
    const sim = 1 - dist / maxLen;
    if (sim > mejor) mejor = sim;
  }
  return mejor >= 0.7 ? mejor * 0.6 : 0;
}

// Filtra y ordena una lista por relevancia frente a una consulta.
export function filtrarPorBusqueda<T>(
  lista: T[],
  query: string,
  extraerTexto: (item: T) => string,
): T[] {
  const q = query.trim();
  if (!q) return lista;

  return lista
    .map((item) => ({ item, score: coincidencia(extraerTexto(item), q) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.item);
}
