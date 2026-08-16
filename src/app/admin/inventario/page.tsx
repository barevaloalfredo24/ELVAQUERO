// =====================================================================
// PÁGINA ADMIN: INVENTARIO / ALERTAS DE STOCK
// ---------------------------------------------------------------------
// Componente de servidor. Muestra un "semáforo" de stock (rojo/amarillo/
// verde) y una sección destacada de productos bajo el umbral, para que
// el equipo detecte faltantes y los reponga a tiempo.
// =====================================================================

import { obtenerAlertasStock, obtenerProductosAdmin } from "@/lib/servicios/admin";
import { categoriaDe } from "@/lib/servicios/catalogo";
import { formatearPrecio } from "@/lib/util";

export default async function PaginaInventario() {
  const [alertas, productos] = await Promise.all([
    obtenerAlertasStock(),
    obtenerProductosAdmin(),
  ]);

  // Clasifica el stock en un semáforo de 3 niveles.
  const estadoStock = (stock: number, umbral: number) => {
    if (stock <= umbral) return { color: "bg-red-500", texto: "text-red-700", etiqueta: "Crítico" };
    if (stock <= umbral * 2) return { color: "bg-amber-500", texto: "text-amber-700", etiqueta: "Bajo" };
    return { color: "bg-green-500", texto: "text-green-700", etiqueta: "Saludable" };
  };

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
                <p className="text-sm text-marron-500">{categoriaDe(p)?.nombre}</p>
                <p className="mt-2 text-sm font-semibold text-red-700">
                  Stock: {p.stockTotal} · Umbral: {p.umbralStock}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Tabla completa de inventario con semáforo. */}
      <div className="overflow-x-auto rounded-xl border border-marron-100 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-marron-100 bg-marron-50 text-xs uppercase tracking-wide text-marron-500">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Umbral</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-marron-50">
            {productos.map((p) => {
              const estado = estadoStock(p.stockTotal, p.umbralStock);
              return (
                <tr key={p.id} className="hover:bg-marron-50/50">
                  <td className="px-4 py-3 font-medium text-marron-900">{p.nombre}</td>
                  <td className="px-4 py-3 text-marron-600">{formatearPrecio(p.precio)}</td>
                  <td className="px-4 py-3 font-semibold text-marron-800">{p.stockTotal}</td>
                  <td className="px-4 py-3 text-marron-500">{p.umbralStock}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${estado.color}`} />
                      <span className={`font-medium ${estado.texto}`}>{estado.etiqueta}</span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
