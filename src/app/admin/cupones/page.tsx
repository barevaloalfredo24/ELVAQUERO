// =====================================================================
// PÁGINA ADMIN: CUPONES
// ---------------------------------------------------------------------
// Componente de servidor que carga los cupones y los pasa al componente
// cliente de gestión (crear/editar/desactivar).
// =====================================================================

import { obtenerCupones } from "@/lib/servicios/admin";
import { GestionCupones } from "@/components/admin/GestionCupones";

export default async function PaginaCupones() {
  const cupones = await obtenerCupones();
  return <GestionCupones cuponesInicial={cupones} />;
}
