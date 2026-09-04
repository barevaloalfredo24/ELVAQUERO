// =====================================================================
// REDIRECCIÓN DESDE /admin
// ---------------------------------------------------------------------
// El antiguo Dashboard fue eliminado; ahora el panel aterriza en la
// sección de productos.
// =====================================================================

import { redirect } from "next/navigation";

export default function PaginaAdmin() {
  redirect("/admin/productos");
}
