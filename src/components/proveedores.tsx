// =====================================================================
// PROVEEDORES GLOBALES
// ---------------------------------------------------------------------
// Componente cliente que envuelve la aplicación con todos los contextos
// (carrito y autenticación). Se monta desde el layout raíz.
// =====================================================================

"use client";

import { CarritoProvider } from "@/lib/contexto/carrito";
import { AuthProvider } from "@/lib/contexto/auth";

export function Proveedores({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CarritoProvider>{children}</CarritoProvider>
    </AuthProvider>
  );
}
