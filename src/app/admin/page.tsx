// =====================================================================
// DASHBOARD DEL ADMINISTRADOR
// ---------------------------------------------------------------------
// Componente de servidor que carga las estadísticas y las muestra en
// tarjetas y gráficas simples (sin librerías externas). Sirve de base
// para el futuro módulo de reportes.
// =====================================================================

import { obtenerEstadisticas } from "@/lib/servicios/admin";
import { formatearPrecio } from "@/lib/util";
import { TarjetaEstadistica } from "@/components/admin/AdminUtil";

export default async function PaginaDashboard() {
  const stats = await obtenerEstadisticas();

  // Máximo de ingresos mensuales para escalar la gráfica de barras.
  const maxMes = Math.max(1, ...stats.ingresosPorMes.map((m) => m.total));

  // Máximo para la gráfica por método de pago.
  const maxMetodo = Math.max(1, ...stats.ventasPorMetodoPago.map((m) => m.total));

  return (
    <div className="space-y-6">
      {/* ============ TARJETAS DE RESUMEN ============ */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <TarjetaEstadistica
          titulo="Ventas totales"
          valor={formatearPrecio(stats.ventasTotales)}
          detalle="Órdenes no canceladas"
          icono="💰"
        />
        <TarjetaEstadistica
          titulo="Órdenes"
          valor={String(stats.numeroOrdenes)}
          detalle="Total de pedidos"
          icono="📦"
        />
        <TarjetaEstadistica
          titulo="Ticket promedio"
          valor={formatearPrecio(stats.ticketPromedio)}
          detalle="Por orden"
          icono="🧾"
        />
        <TarjetaEstadistica
          titulo="Clientes"
          valor={String(stats.clientesRegistrados)}
          detalle="Registrados"
          icono="👥"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* ============ GRÁFICA DE INGRESOS POR MES ============ */}
        <section className="rounded-xl border border-marron-100 bg-white p-5 shadow-sm xl:col-span-2">
          <h2 className="mb-4 font-display text-lg font-bold text-marron-900">
            Ingresos por mes
          </h2>
          <div className="flex h-48 items-end gap-3">
            {stats.ingresosPorMes.map((m) => (
              <div key={m.etiqueta} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs font-medium text-marron-600">
                  {formatearPrecio(m.total)}
                </span>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-marron-700 to-dorado"
                  style={{ height: `${Math.max(8, (m.total / maxMes) * 100)}%` }}
                />
                <span className="text-xs capitalize text-marron-500">{m.etiqueta}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ============ VENTAS POR MÉTODO DE PAGO ============ */}
        <section className="rounded-xl border border-marron-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-display text-lg font-bold text-marron-900">Por método de pago</h2>
          <div className="space-y-4">
            {stats.ventasPorMetodoPago.map((m) => (
              <div key={m.etiqueta}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-marron-600">{m.etiqueta}</span>
                  <span className="font-semibold text-marron-900">{formatearPrecio(m.total)}</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-marron-100">
                  <div
                    className="h-full rounded-full bg-dorado"
                    style={{ width: `${(m.total / maxMetodo) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ============ PRODUCTOS MÁS VENDIDOS ============ */}
      <section className="rounded-xl border border-marron-100 bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-display text-lg font-bold text-marron-900">Productos más vendidos</h2>
        <div className="space-y-2">
          {stats.productosMasVendidos.map(({ producto, cantidad }) => (
            <div
              key={producto.id}
              className="flex items-center justify-between rounded-lg bg-marron-50 px-4 py-2.5"
            >
              <span className="font-medium text-marron-800">{producto.nombre}</span>
              <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-marron-700">
                {cantidad} vendidos
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ============ ALERTA DE STOCK ============ */}
      {stats.alertasStock > 0 && (
        <section className="rounded-xl border border-amber-300 bg-amber-50 p-5">
          <h2 className="font-display text-lg font-bold text-amber-900">⚠️ Alertas de inventario</h2>
          <p className="mt-1 text-sm text-amber-800">
            Hay <strong>{stats.alertasStock}</strong> producto(s) por debajo de su umbral de stock.
            Revisa la sección de inventario.
          </p>
        </section>
      )}
    </div>
  );
}
