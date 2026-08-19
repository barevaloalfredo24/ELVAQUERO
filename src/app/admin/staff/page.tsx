// =====================================================================
// PÁGINA ADMIN: STAFF
// ---------------------------------------------------------------------
// Componente de servidor que carga la lista de staff y la pasa al
// componente cliente de gestión (crear/editar/desactivar).
// =====================================================================

import { obtenerStaff } from "@/lib/servicios/admin";
import { GestionStaff } from "@/components/admin/GestionStaff";

export default async function PaginaStaff() {
  const staff = await obtenerStaff();
  return <GestionStaff staffInicial={staff} />;
}
