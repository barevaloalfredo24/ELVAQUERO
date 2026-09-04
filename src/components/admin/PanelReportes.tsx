// =====================================================================
// PANEL DE REPORTES (cliente)
// ---------------------------------------------------------------------
// Gráficas interactivas (barras, líneas, pastel, histograma) con filtros
// de fecha/categoría/método de pago, actualización en vivo, exportación
// a CSV e impresión.
// =====================================================================

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { obtenerReporte } from "@/lib/servicios/admin";
import { formatearPrecio } from "@/lib/util";
import type { Categoria, FiltrosReporte, ReporteAdmin } from "@/lib/tipos";

// Paleta de colores de la marca para las gráficas.
const COLORES = ["#a96a3a", "#c98a3d", "#74422a", "#d3ab80", "#8f5430", "#5c3423"];

// Formatea un valor numérico como moneda dentro de los tooltips.
function tooltipMoneda(value: unknown) {
  return formatearPrecio(Number(value ?? 0));
}

// Formato compacto de moneda para las etiquetas sobre las barras.
function cortaMoneda(value: unknown) {
  const n = Number(value ?? 0);
  if (n >= 1000) return `Q${(n / 1000).toFixed(1)}k`;
  return `Q${Math.round(n)}`;
}

export function PanelReportes({
  reporteInicial,
  categorias,
  masVendidos,
}: {
  reporteInicial: ReporteAdmin;
  categorias: Categoria[];
  masVendidos: { producto: { id: string; nombre: string }; cantidad: number }[];
}) {
  const [reporte, setReporte] = useState<ReporteAdmin>(reporteInicial);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [categoria, setCategoria] = useState("");
  const [metodoPago, setMetodoPago] = useState("");
  const [cargando, setCargando] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Ref con los filtros actuales para usarlos en el auto-refresh.
  const filtrosRef = useRef<FiltrosReporte>({});

  // Sincroniza los filtros al ref después de cada render.
  useEffect(() => {
    filtrosRef.current = { desde, hasta, categoria, metodoPago };
  });

  // Carga el reporte con un conjunto de filtros.
  const cargar = useCallback(async (filtros: FiltrosReporte) => {
    setCargando(true);
    const datos = await obtenerReporte(filtros);
    if (datos) setReporte(datos);
    setCargando(false);
  }, []);

  // Auto-refresh: consulta cada 30 segundos mientras esté activado.
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      void cargar(filtrosRef.current);
    }, 30000);
    return () => clearInterval(id);
  }, [autoRefresh, cargar]);

  // Aplica los filtros seleccionados.
  function aplicarFiltros() {
    void cargar({ desde, hasta, categoria, metodoPago });
  }

  // Genera y descarga un CSV con los datos actuales del reporte.
  function exportarCSV() {
    if (!reporte) return;
    const filas: string[] = [];
    filas.push("Resumen");
    filas.push("Ingresos,Órdenes,Ticket promedio,Unidades vendidas");
    filas.push(
      `${reporte.resumen.ingresos},${reporte.resumen.ordenes},${reporte.resumen.ticketPromedio},${reporte.resumen.unidadesVendidas}`,
    );
    filas.push("");
    filas.push("Serie de tiempo");
    filas.push("Fecha,Ingresos,Órdenes");
    reporte.serieTiempo.forEach((s) => filas.push(`${s.fecha},${s.ingresos},${s.ordenes}`));
    filas.push("");
    filas.push("Ventas por categoría");
    filas.push("Categoría,Ingresos,Órdenes");
    reporte.porCategoria.forEach((c) => filas.push(`${c.categoria},${c.ingresos},${c.ordenes}`));
    filas.push("");
    filas.push("Ventas por método de pago");
    filas.push("Método,Ingresos,Porcentaje");
    reporte.porMetodoPago.forEach((m) =>
      filas.push(`${m.metodo},${m.ingresos},${m.porcentaje}`),
    );
    filas.push("");
    filas.push("Histograma de montos");
    filas.push("Rango,Órdenes");
    reporte.histograma.forEach((h) => filas.push(`${h.rango},${h.ordenes}`));

    // BOM para que Excel reconozca UTF-8 correctamente.
    const csv = "\uFEFF" + filas.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "reporte-ventas.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function imprimir() {
    window.print();
  }

  // Datos de apoyo para las descripciones de cada gráfica.
  const dias = reporte.serieTiempo.length;
  const topCategoria = reporte.porCategoria[0];
  const topMetodo = reporte.porMetodoPago[0];
  const rangoTop = [...reporte.histograma].sort((a, b) => b.ordenes - a.ordenes)[0];
  const nombreCategoria = categorias.find((c) => c.slug === categoria)?.nombre;

  // Resumen de los filtros aplicados (para contextualizar el reporte).
  let periodo = "todo el histórico";
  if (desde && hasta) periodo = `del ${desde} al ${hasta}`;
  else if (desde) periodo = `desde ${desde}`;
  else if (hasta) periodo = `hasta ${hasta}`;
  const descripcionFiltros =
    `Período: ${periodo}` +
    (nombreCategoria ? ` · Categoría: ${nombreCategoria}` : " · Categoría: todas") +
    (metodoPago ? ` · Pago: ${metodoPago === "tarjeta" ? "tarjeta" : "contra entrega"}` : " · Pago: todos");

  // Puntos de inflexión de la serie de tiempo (pico y valle).
  const pico = reporte.serieTiempo.length
    ? reporte.serieTiempo.reduce((a, b) => (a.ingresos >= b.ingresos ? a : b))
    : null;
  const valle = reporte.serieTiempo.length
    ? reporte.serieTiempo.reduce((a, b) => (a.ingresos <= b.ingresos ? a : b))
    : null;

  return (
    <div className="space-y-6">
      {/* ============ FILTROS ============ */}
      <div className="no-imprimir flex flex-wrap items-end gap-3 rounded-xl border border-marron-100 bg-white p-4">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-marron-700">Desde</span>
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="rounded-lg border border-marron-200 px-3 py-2 outline-none focus:border-marron-500"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-marron-700">Hasta</span>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="rounded-lg border border-marron-200 px-3 py-2 outline-none focus:border-marron-500"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-marron-700">Categoría</span>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="rounded-lg border border-marron-200 bg-white px-3 py-2 outline-none focus:border-marron-500"
          >
            <option value="">Todas</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-marron-700">Método de pago</span>
          <select
            value={metodoPago}
            onChange={(e) => setMetodoPago(e.target.value)}
            className="rounded-lg border border-marron-200 bg-white px-3 py-2 outline-none focus:border-marron-500"
          >
            <option value="">Todos</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="contra_entrega">Contra entrega</option>
          </select>
        </label>
        <button
          type="button"
          onClick={aplicarFiltros}
          disabled={cargando}
          className="rounded-lg bg-marron-700 px-5 py-2 text-sm font-semibold text-white hover:bg-marron-800 disabled:opacity-60"
        >
          {cargando ? "Cargando…" : "Aplicar filtros"}
        </button>
        <label className="flex items-center gap-2 text-sm text-marron-700">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          Actualizar en vivo (30s)
        </label>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={exportarCSV}
            className="rounded-lg border border-marron-200 px-4 py-2 text-sm font-medium text-marron-700 hover:bg-marron-50"
          >
            ⬇ Exportar CSV
          </button>
          <button
            type="button"
            onClick={imprimir}
            className="rounded-lg border border-marron-200 px-4 py-2 text-sm font-medium text-marron-700 hover:bg-marron-50"
          >
            🖨 Imprimir
          </button>
        </div>
      </div>

      {/* ============ ENCABEZADO DEL REPORTE ============ */}
      <div className="rounded-xl border border-marron-100 bg-white p-4 text-sm text-marron-700">
        <p className="font-display text-lg font-bold text-marron-900">
          Reporte de ventas · El Vaquero
        </p>
        <p className="mt-1">
          {descripcionFiltros}. Se registraron{" "}
          <strong>{formatearPrecio(reporte.resumen.ingresos)}</strong> en{" "}
          <strong>{reporte.resumen.ordenes}</strong> órdenes y{" "}
          <strong>{reporte.resumen.unidadesVendidas}</strong> unidades vendidas.
        </p>
      </div>

      {/* ============ RESUMEN (KPIs) ============ */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { titulo: "Ingresos", valor: formatearPrecio(reporte.resumen.ingresos), icono: "💰" },
          { titulo: "Órdenes", valor: String(reporte.resumen.ordenes), icono: "📦" },
          { titulo: "Ticket promedio", valor: formatearPrecio(reporte.resumen.ticketPromedio), icono: "🧾" },
          { titulo: "Unidades vendidas", valor: String(reporte.resumen.unidadesVendidas), icono: "🏷️" },
        ].map((k) => (
          <div key={k.titulo} className="rounded-xl border border-marron-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-marron-500">{k.titulo}</span>
              <span className="text-xl">{k.icono}</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-marron-900">{k.valor}</p>
          </div>
        ))}
      </div>

      {/* ============ GRÁFICAS ============ */}
      <div className="grid-reportes grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Línea: cambios en el tiempo. */}
        <section className="reporte-grafica rounded-xl border border-marron-100 bg-white p-5 shadow-sm">
          <h2 className="mb-1 font-display text-lg font-bold text-marron-900">
            Ingresos por día (línea)
          </h2>
          <p className="mb-4 text-sm text-marron-600">
            Muestra la evolución de los ingresos día a día para detectar picos y caídas de ventas.{" "}
            {dias > 0
              ? `Hay ${dias} día(s) con ventas en el período seleccionado.`
              : "No hay ventas registradas en el período seleccionado."}
          </p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reporte.serieTiempo} margin={{ top: 20, right: 30, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4cdb0" />
                <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={tooltipMoneda} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="ingresos"
                  name="Ingresos"
                  stroke="#a96a3a"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#a96a3a", stroke: "#fff", strokeWidth: 2 }}
                />
                {pico && (
                  <ReferenceDot
                    x={pico.fecha}
                    y={pico.ingresos}
                    r={7}
                    fill="#c98a3d"
                    stroke="#fff"
                    strokeWidth={2}
                    label={{ value: `Pico ${formatearPrecio(pico.ingresos)}`, position: "top", fontSize: 12, fill: "#74422a" }}
                  />
                )}
                {valle && valle.fecha !== pico?.fecha && (
                  <ReferenceDot
                    x={valle.fecha}
                    y={valle.ingresos}
                    r={7}
                    fill="#8f5430"
                    stroke="#fff"
                    strokeWidth={2}
                    label={{ value: `Valle ${formatearPrecio(valle.ingresos)}`, position: "bottom", fontSize: 12, fill: "#74422a" }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Barras: comparar categorías. */}
        <section className="reporte-grafica rounded-xl border border-marron-100 bg-white p-5 shadow-sm">
          <h2 className="mb-1 font-display text-lg font-bold text-marron-900">
            Ingresos por categoría (barras)
          </h2>
          <p className="mb-4 text-sm text-marron-600">
            Compara los ingresos de cada categoría para saber cuáles venden más.{" "}
            {topCategoria
              ? `La categoría líder es "${topCategoria.categoria}" con ${formatearPrecio(topCategoria.ingresos)}.`
              : "No hay datos por categoría en el período seleccionado."}
          </p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reporte.porCategoria} margin={{ top: 20, right: 30, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4cdb0" />
                <XAxis dataKey="categoria" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={55} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={tooltipMoneda} />
                <Bar dataKey="ingresos" name="Ingresos" fill="#c98a3d" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="ingresos" position="top" formatter={cortaMoneda} style={{ fontSize: 11, fill: "#74422a" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Pastel: partes de un todo. */}
        <section className="reporte-grafica rounded-xl border border-marron-100 bg-white p-5 shadow-sm">
          <h2 className="mb-1 font-display text-lg font-bold text-marron-900">
            Ventas por método de pago (pastel)
          </h2>
          <p className="mb-4 text-sm text-marron-600">
            Indica la proporción de ventas según el método de pago (tarjeta o contra entrega).{" "}
            {topMetodo
              ? `Predomina "${topMetodo.metodo}" con el ${topMetodo.porcentaje}% de las ventas.`
              : "No hay datos de métodos de pago en el período seleccionado."}
          </p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={reporte.porMetodoPago}
                  dataKey="ingresos"
                  nameKey="metodo"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={(e) => `${Math.round((e.percent ?? 0) * 100)}%`}
                >
                  {reporte.porMetodoPago.map((_, i) => (
                    <Cell key={i} fill={COLORES[i % COLORES.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={tooltipMoneda} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Histograma: montos agrupados. */}
        <section className="reporte-grafica rounded-xl border border-marron-100 bg-white p-5 shadow-sm">
          <h2 className="mb-1 font-display text-lg font-bold text-marron-900">
            Distribución de montos de orden (histograma)
          </h2>
          <p className="mb-4 text-sm text-marron-600">
            Agrupa las órdenes por rango de monto para ver en qué precios se concentran las compras.{" "}
            {rangoTop
              ? `El rango más frecuente es "${rangoTop.rango}" con ${rangoTop.ordenes} orden(es).`
              : "No hay datos de montos en el período seleccionado."}
          </p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reporte.histograma} margin={{ top: 20, right: 30, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4cdb0" />
                <XAxis dataKey="rango" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={55} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="ordenes" name="Órdenes" fill="#74422a" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="ordenes" position="top" style={{ fontSize: 11, fill: "#74422a" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* ============ PRODUCTOS MÁS VENDIDOS ============ */}
      {masVendidos.length > 0 && (
        <section className="rounded-xl border border-marron-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-display text-lg font-bold text-marron-900">
            Productos más vendidos
          </h2>
          <div className="space-y-2">
            {masVendidos.map(({ producto, cantidad }) => (
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
      )}
    </div>
  );
}
