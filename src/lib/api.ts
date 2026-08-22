// =====================================================================
// CLIENTE HTTP HACIA EL BACKEND
// ---------------------------------------------------------------------
// Punto único de acceso a la API NestJS.
//   - En el servidor (RSC) usa API_URL (red interna en Docker).
//   - En el navegador usa NEXT_PUBLIC_API_URL (relativa o absoluta).
// Si ninguna está definida, se usa la URL relativa (ej. /api/...), útil
// detrás de un reverse proxy (nginx) en producción.
// =====================================================================

// URL base para el navegador (se inyecta en el bundle en build time).
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

// Detecta si el código se ejecuta en el servidor.
const esServidor = typeof window === "undefined";

// Devuelve la URL base correcta según el entorno de ejecución.
function baseUrl(): string {
  if (esServidor) {
    // En el servidor se prefiere la URL interna (docker network).
    return process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "";
  }
  return process.env.NEXT_PUBLIC_API_URL ?? "";
}

// Construye la URL completa (o relativa si no hay base).
function urlCompleta(ruta: string): string {
  const base = baseUrl();
  return base ? `${base}${ruta}` : ruta;
}

// Realiza una petición y devuelve el JSON; null si falla.
export async function peticion<T>(
  ruta: string,
  opciones?: RequestInit,
): Promise<T | null> {
  try {
    const res = await fetch(urlCompleta(ruta), {
      ...opciones,
      // No cachear para evitar datos obsoletos (stats, pedidos, etc.).
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(opciones?.headers ?? {}),
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// Resultado de una petición autenticada (con token JWT).
export interface ResultadoPeticion<T> {
  ok: boolean;
  status: number;
  data?: T;
  mensaje?: string;
}

// Realiza una petición autenticada (Bearer token). Devuelve el estado y,
// si falla, el mensaje de error del backend para mostrarlo al usuario.
export async function peticionAuth<T>(
  ruta: string,
  token: string,
  opciones?: RequestInit,
): Promise<ResultadoPeticion<T>> {
  try {
    const res = await fetch(urlCompleta(ruta), {
      ...opciones,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(opciones?.headers ?? {}),
      },
    });
    const data = await res.json().catch(() => null);
    const mensaje = Array.isArray(data?.message)
      ? (data.message as string[]).join(", ")
      : data?.message;
    return {
      ok: res.ok,
      status: res.status,
      data: (data as T) ?? undefined,
      mensaje,
    };
  } catch {
    return { ok: false, status: 0, mensaje: "Error de conexión con el backend." };
  }
}
