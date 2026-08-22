// =====================================================================
// BOTÓN DE LISTA DE DESEOS (corazón)
// ---------------------------------------------------------------------
// Permite guardar/quitar un producto de la wishlist del usuario. Si no
// hay sesión, redirige al login. Se oculta para el rol staff.
// =====================================================================

"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexto/auth";
import { useDeseos } from "@/lib/contexto/deseos";

function IconoCorazon({ lleno }: { lleno: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill={lleno ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

export function BotonDeseo({ productoId }: { productoId: string }) {
  const { autenticado, esStaff } = useAuth();
  const { estaEnDeseos, alternar } = useDeseos();
  const router = useRouter();

  // El staff no usa wishlist.
  if (esStaff) return null;

  const activo = estaEnDeseos(productoId);

  function manejarClick() {
    if (!autenticado) {
      router.push("/login?redirigir=/catalogo");
      return;
    }
    void alternar(productoId);
  }

  return (
    <button
      type="button"
      onClick={manejarClick}
      aria-label={activo ? "Quitar de la lista de deseos" : "Agregar a la lista de deseos"}
      title={activo ? "Quitar de la lista de deseos" : "Agregar a la lista de deseos"}
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm transition hover:scale-105 ${
        activo ? "text-red-600" : "text-marron-500 hover:text-red-500"
      }`}
    >
      <IconoCorazon lleno={activo} />
    </button>
  );
}
