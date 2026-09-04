// =====================================================================
// PÁGINA ADMIN: REPORTES
// ---------------------------------------------------------------------
// Componente de servidor que carga el reporte inicial, las categorías y
// los productos más vendidos, y los pasa al componente cliente.
// =====================================================================

import { obtenerReporte, obtenerEstadisticas } from "@/lib/servicios/admin";
import { obtenerCategorias } from "@/lib/servicios/catalogo";
import { PanelReportes } from "@/components/admin/PanelReportes";
import type { ReporteAdmin } from "@/lib/tipos";

// Reporte vacío (por si la API no responde).
const REPORTE_VACIO: ReporteAdmin = {
  resumen: { ingresos: 0, ordenes: 0, ticketPromedio: 0, unidadesVendidas: 0 },
  serieTiempo: [],
  porCategoria: [],
  porMetodoPago: [],
  histograma: [],
};

export default async function PaginaReportes() {
  const [reporte, categorias, stats] = await Promise.all([
    obtenerReporte(),
    obtenerCategorias(),
    obtenerEstadisticas(),
  ]);

  return (
    <PanelReportes
      reporteInicial={reporte ?? REPORTE_VACIO}
      categorias={categorias}
      masVendidos={stats?.productosMasVendidos ?? []}
    />
  );
}
