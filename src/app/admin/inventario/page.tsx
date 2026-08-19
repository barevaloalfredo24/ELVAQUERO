// =====================================================================
// PÁGINA ADMIN: INVENTARIO / ALERTAS DE STOCK
// ---------------------------------------------------------------------
// Componente de servidor. Muestra las alertas de bajo stock y delega la
// tabla (con buscador) a un componente cliente.
// =====================================================================

import { obtenerAlertasStock, obtenerProductosAdmin } from "@/lib/servicios/admin";
import { TablaInventario } from "@/components/admin/TablaInventario";

export default async function PaginaInventario() {
  const [alertas, productos] = await Promise.all([
    obtenerAlertasStock(),
    obtenerProductosAdmin(),
  ]);

  return (
    <div className="space-y-6">
      {/* Sección de alertas críticas. */}
      <section className="rounded-xl border border-red-200 bg-red-50 p-5">
        <h2 className="font-display text-lg font-bold text-red-800">
          ⚠️ Productos bajo el umbral ({alertas.length})
        </h2>
        {alertas.length === 0 ? (
          <p className="mt-2 text-sm text-red-700">No hay productos en nivel crítico. ¡Todo en orden!</p>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {alertas.map((p) => (
              <div key={p.id} className="rounded-lg border border-red-200 bg-white p-4">
                <p className="font-medium text-marron-900">{p.nombre}</p>
                <p className="text-sm text-marron-500">{p.categoriaNombre}</p>
                <p className="mt-2 text-sm font-semibold text-red-700">
                  Stock: {p.stockTotal} · Umbral: {p.umbralStock}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Tabla con buscador (componente cliente). */}
      <TablaInventario productos={productos} />
    </div>
  );
}
