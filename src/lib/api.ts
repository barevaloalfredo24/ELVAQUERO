// =====================================================================
// CLIENTE HTTP HACIA EL BACKEND
// ---------------------------------------------------------------------
// Punto único de acceso a la API NestJS. Si NEXT_PUBLIC_API_URL no está
// definida, devuelve null para que los servicios puedan usar el mock.
// =====================================================================

// URL base de la API (definida en .env.local).
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

// Realiza una petición y devuelve el JSON; null si falla o no hay API.
export async function peticion<T>(
  ruta: string,
  opciones?: RequestInit,
): Promise<T | null> {
  if (!API_URL) return null;
  try {
    const res = await fetch(`${API_URL}${ruta}`, {
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
  if (!API_URL) return { ok: false, status: 0, mensaje: "API no configurada." };
  try {
    const res = await fetch(`${API_URL}${ruta}`, {
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
