// =====================================================================
// SERVICIO DE LISTA DE DESEOS (frontend)
// ---------------------------------------------------------------------
// Llama a los endpoints protegidos /api/deseos usando el token JWT.
// =====================================================================

import { peticionAuth } from "@/lib/api";
import type { Producto } from "@/lib/tipos";

export async function obtenerDeseos(token: string): Promise<Producto[]> {
  const res = await peticionAuth<Producto[]>("/api/deseos", token);
  return res.ok && res.data ? res.data : [];
}

export async function obtenerDeseosIds(token: string): Promise<string[]> {
  const res = await peticionAuth<string[]>("/api/deseos/ids", token);
  return res.ok && res.data ? res.data : [];
}

export async function agregarDeseo(token: string, productoId: string): Promise<boolean> {
  const res = await peticionAuth(`/api/deseos/${productoId}`, token, { method: "POST" });
  return res.ok;
}

export async function quitarDeseo(token: string, productoId: string): Promise<boolean> {
  const res = await peticionAuth(`/api/deseos/${productoId}`, token, { method: "DELETE" });
  return res.ok;
}
