// =====================================================================
// PÁGINA ADMIN: PRODUCTOS
// ---------------------------------------------------------------------
// Componente de servidor que lista el catálogo en una tabla. En fases
// futuras aquí habrá botones para crear/editar/eliminar productos.
// =====================================================================

import Link from "next/link";
import { obtenerProductosAdmin } from "@/lib/servicios/admin";
import { categoriaDe } from "@/lib/servicios/catalogo";
import { formatearPrecio } from "@/lib/util";

export default async function PaginaProductos() {
  const productos = await obtenerProductosAdmin();

  return (
    <div className="space-y-4">
      {/* Cabecera con acciones. */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-marron-500">{productos.length} productos en el catálogo</p>
        <button
          type="button"
          className="rounded-full bg-marron-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-marron-800"
        >
          + Nuevo producto
        </button>
      </div>

      {/* Tabla con scroll horizontal en pantallas pequeñas. */}
      <div className="overflow-x-auto rounded-xl border border-marron-100 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-marron-100 bg-marron-50 text-xs uppercase tracking-wide text-marron-500">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Ver</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-marron-50">
            {productos.map((p) => {
              const categoria = categoriaDe(p);
              const bajoStock = p.stockTotal <= p.umbralStock;
              return (
                <tr key={p.id} className="hover:bg-marron-50/50">
                  <td className="px-4 py-3">
                    <span className="font-medium text-marron-900">{p.nombre}</span>
                    {p.enOferta && (
                      <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        Oferta
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-marron-600">{categoria?.nombre}</td>
                  <td className="px-4 py-3 font-medium text-marron-800">
                    {formatearPrecio(p.precio)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-medium ${
                        bajoStock ? "text-amber-600" : "text-green-700"
                      }`}
                    >
                      {p.stockTotal}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.disponible ? (
                      <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                        Disponible
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600">
                        Agotado
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/producto/${p.id}`}
                      className="font-medium text-marron-600 hover:underline"
                    >
                      Ver
                    </Link>
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
