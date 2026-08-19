// =====================================================================
// PÁGINA ADMIN: PRODUCTOS
// ---------------------------------------------------------------------
// Componente de servidor que carga el catálogo y las categorías y los
// pasa al componente cliente de gestión (crear/editar/desactivar).
// =====================================================================

import { obtenerProductosAdmin } from "@/lib/servicios/admin";
import { obtenerCategorias } from "@/lib/servicios/catalogo";
import { GestionProductos } from "@/components/admin/GestionProductos";

export default async function PaginaProductos() {
  const [productos, categorias] = await Promise.all([
    obtenerProductosAdmin(),
    obtenerCategorias(),
  ]);

  return <GestionProductos productosInicial={productos} categorias={categorias} />;
}
