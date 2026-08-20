// =====================================================================
// PÁGINA ADMIN: REPORTES
// ---------------------------------------------------------------------
// Componente de servidor que carga el reporte inicial y las categorías
// y los pasa al componente cliente de gráficas.
// =====================================================================

import { obtenerReporte } from "@/lib/servicios/admin";
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
  const [reporte, categorias] = await Promise.all([
    obtenerReporte(),
    obtenerCategorias(),
  ]);

  return <PanelReportes reporteInicial={reporte ?? REPORTE_VACIO} categorias={categorias} />;
}
