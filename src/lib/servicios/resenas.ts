// =====================================================================
// SERVICIO DE RESEÑAS (frontend)
// ---------------------------------------------------------------------
// Consume los endpoints de reseñas del backend NestJS.
// =====================================================================

import { peticion, peticionAuth } from "@/lib/api";
import type { Resena } from "@/lib/tipos";

// Lista las reseñas aprobadas de un producto.
export async function obtenerResenas(productoId: string): Promise<Resena[]> {
  const desdeApi = await peticion<Resena[]>(`/api/resenas/producto/${productoId}`);
  return desdeApi ?? [];
}

// Crea o actualiza la reseña del usuario (1 a 5 estrellas + comentario opcional).
export async function enviarResena(
  productoId: string,
  calificacion: number,
  comentario: string,
  token: string,
): Promise<{ ok: boolean; mensaje?: string; resena?: Resena }> {
  const resultado = await peticionAuth<Resena>(`/api/resenas/producto/${productoId}`, token, {
    method: "POST",
    body: JSON.stringify({ calificacion, comentario }),
  });
  return {
    ok: resultado.ok,
    mensaje: resultado.mensaje,
    resena: resultado.data,
  };
}
