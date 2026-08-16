// =====================================================================
// LAYOUT DE LA TIENDA (lado cliente)
// ---------------------------------------------------------------------
// Envuelve todas las páginas públicas con el encabezado y el pie de
// página. Se ubica en el grupo de rutas "(tienda)" para que la URL no
// incluya un prefijo extra (la home queda en "/").
// =====================================================================

import { Header } from "@/components/tienda/Header";
import { Footer } from "@/components/tienda/Footer";

export default function TiendaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Encabezado con navegación, búsqueda, carrito y cuenta. */}
      <Header />
      {/* Contenido de cada página. */}
      <main className="flex-1">{children}</main>
      {/* Pie de página. */}
      <Footer />
    </>
  );
}
