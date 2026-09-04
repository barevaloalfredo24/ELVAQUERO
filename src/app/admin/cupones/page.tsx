// =====================================================================
// PÁGINA ADMIN: CUPONES Y OFERTAS
// ---------------------------------------------------------------------
// Componente de servidor que carga los cupones generales y los productos,
// y renderiza la gestión de cupones + el panel de ofertas por producto.
// =====================================================================

import { obtenerCupones, obtenerProductosAdmin } from "@/lib/servicios/admin";
import { GestionCupones } from "@/components/admin/GestionCupones";
import { GestionOfertas } from "@/components/admin/GestionOfertas";

export default async function PaginaCupones() {
  const [cupones, productos] = await Promise.all([
    obtenerCupones(),
    obtenerProductosAdmin(),
  ]);

  return (
    <div className="space-y-8">
      <GestionCupones cuponesInicial={cupones} />
      <GestionOfertas productos={productos} />
    </div>
  );
}
