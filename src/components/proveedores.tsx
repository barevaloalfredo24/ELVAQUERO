// =====================================================================
// PROVEEDORES GLOBALES
// ---------------------------------------------------------------------
// Componente cliente que envuelve la aplicación con todos los contextos
// (carrito y autenticación). Se monta desde el layout raíz.
// =====================================================================

"use client";

import { CarritoProvider } from "@/lib/contexto/carrito";
import { AuthProvider } from "@/lib/contexto/auth";
import { DeseosProvider } from "@/lib/contexto/deseos";

export function Proveedores({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CarritoProvider>
        <DeseosProvider>{children}</DeseosProvider>
      </CarritoProvider>
    </AuthProvider>
  );
}
