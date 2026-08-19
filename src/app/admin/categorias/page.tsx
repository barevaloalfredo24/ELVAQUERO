// =====================================================================
// PÁGINA ADMIN: CATEGORÍAS
// ---------------------------------------------------------------------
// Componente de servidor que carga las categorías y las pasa al
// componente cliente de gestión (crear/editar/eliminar).
// =====================================================================

import { obtenerCategorias } from "@/lib/servicios/catalogo";
import { GestionCategorias } from "@/components/admin/GestionCategorias";

export default async function PaginaCategorias() {
  const categorias = await obtenerCategorias();
  return <GestionCategorias categoriasInicial={categorias} />;
}
