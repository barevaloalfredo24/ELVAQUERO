// =====================================================================
// PÁGINA ADMIN: PEDIDOS
// ---------------------------------------------------------------------
// Componente de servidor que carga los pedidos y los pasa al componente
// cliente de gestión (filtro por estado + asignación de seguimiento).
// =====================================================================

import { obtenerPedidos } from "@/lib/servicios/admin";
import { GestionPedidos } from "@/components/admin/GestionPedidos";

export default async function PaginaPedidos() {
  const pedidos = await obtenerPedidos();
  return <GestionPedidos pedidosInicial={pedidos} />;
}
