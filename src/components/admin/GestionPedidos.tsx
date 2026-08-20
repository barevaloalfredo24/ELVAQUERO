// =====================================================================
// GESTIÓN DE PEDIDOS (cliente)
// ---------------------------------------------------------------------
// Lista los pedidos con filtro por estado (incluye "pendientes de envío")
// y permite asignar el número de seguimiento + paquetería (cambia el
// estado a "enviado"). Solo admin/staff. Muestra el estado de pago y el
// estado de la orden por separado.
// =====================================================================

"use client";

import { useState } from "react";
import { useAuth } from "@/lib/contexto/auth";
import { peticionAuth } from "@/lib/api";
import { obtenerPedidos } from "@/lib/servicios/admin";
import { formatearFecha, formatearPrecio } from "@/lib/util";
import { InsigniaEstado } from "@/components/admin/AdminUtil";
import type { Orden } from "@/lib/tipos";

// Opciones del filtro por estado (valores del frontend).
const OPCIONES_ESTADO = [
  { valor: "", etiqueta: "Todos los pedidos" },
  { valor: "pendiente_envio", etiqueta: "🚚 Pendientes de envío" },
  { valor: "pendiente", etiqueta: "Pendiente" },
  { valor: "pago_pendiente", etiqueta: "Pago contra entrega" },
  { valor: "pagada", etiqueta: "Pagada" },
  { valor: "enviada", etiqueta: "Enviada" },
  { valor: "entregada", etiqueta: "Entregada" },
  { valor: "cancelada", etiqueta: "Cancelada" },
];

// Insignia del estado de pago.
function InsigniaPago({ estadoPago }: { estadoPago?: string }) {
  if (!estadoPago || estadoPago === "pendiente") return null;
  const estilos: Record<string, string> = {
    pagado: "bg-green-100 text-green-700",
    fallido: "bg-red-100 text-red-700",
    reembolsado: "bg-gray-200 text-gray-600",
  };
  const etiquetas: Record<string, string> = {
    pagado: "Pagado",
    fallido: "Pago fallido",
    reembolsado: "Reembolsado",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${estilos[estadoPago] ?? "bg-gray-100 text-gray-600"}`}>
      {etiquetas[estadoPago] ?? estadoPago}
    </span>
  );
}

export function GestionPedidos({ pedidosInicial }: { pedidosInicial: Orden[] }) {
  const { token, autenticado, usuario } = useAuth();
  const puedeGestionar = autenticado && (usuario?.rol === "admin" || usuario?.rol === "staff");

  const [lista, setLista] = useState<Orden[]>(pedidosInicial);
  const [estadoFiltro, setEstadoFiltro] = useState("");

  // Estado del formulario de seguimiento.
  const [pedidoEdicion, setPedidoEdicion] = useState<Orden | null>(null);
  const [numeroSeguimiento, setNumeroSeguimiento] = useState("");
  const [paqueteria, setPaqueteria] = useState("");
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);

  if (!puedeGestionar) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-marron-100 bg-white py-16 text-center">
        <span className="text-5xl">🔐</span>
        <p className="text-lg font-medium text-marron-800">
          Inicia sesión como administrador o staff para gestionar los pedidos.
        </p>
      </div>
    );
  }

  // Recarga todos los pedidos desde la API.
  async function recargar() {
    const datos = await obtenerPedidos();
    if (datos) setLista(datos);
  }

  // Filtro client-side sobre la lista cargada.
  const filtrados =
    estadoFiltro === "pendiente_envio"
      ? lista.filter((o) => o.estado === "pagada" && !o.numeroSeguimiento)
      : estadoFiltro
        ? lista.filter((o) => o.estado === estadoFiltro)
        : lista;

  // Abre el formulario de seguimiento para un pedido.
  function abrirSeguimiento(o: Orden) {
    setPedidoEdicion(o);
    setNumeroSeguimiento(o.numeroSeguimiento ?? "");
    setPaqueteria(o.paqueteria ?? "");
    setError("");
    setMensaje("");
  }

  // Guarda el seguimiento (cambia estado a "enviado").
  async function guardarSeguimiento(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!pedidoEdicion) return;
    setGuardando(true);
    setError("");
    const resultado = await peticionAuth(
      `/api/admin/pedidos/${pedidoEdicion.id}/seguimiento`,
      token!,
      { method: "PATCH", body: JSON.stringify({ numeroSeguimiento, paqueteria }) },
    );
    setGuardando(false);

    if (resultado.ok) {
      setPedidoEdicion(null);
      setMensaje("Seguimiento asignado. El pedido está en camino.");
      await recargar();
    } else {
      setError(resultado.mensaje ?? "No se pudo asignar el seguimiento.");
    }
  }

  return (
    <div className="space-y-4">
      {/* Cabecera con filtro. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-marron-500">
          {filtrados.length} pedido{filtrados.length !== 1 ? "s" : ""}
        </p>
        <select
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value)}
          className="rounded-lg border border-marron-200 bg-white px-3 py-2 text-sm outline-none focus:border-marron-500"
        >
          {OPCIONES_ESTADO.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.etiqueta}
            </option>
          ))}
        </select>
      </div>

      {mensaje && (
        <p className="rounded-lg bg-green-100 px-3 py-2 text-sm font-medium text-green-800">{mensaje}</p>
      )}

      {/* Lista de pedidos (tarjetas apiladas). */}
      <div className="space-y-3">
        {filtrados.map((o) => (
          <div key={o.id} className="rounded-xl border border-marron-100 bg-white p-4 shadow-sm">
            {/* Fila superior: id, fecha y estados. */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-semibold text-marron-900">{o.id}</span>
                <span className="ml-2 text-sm text-marron-500">{formatearFecha(o.fecha)}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <InsigniaPago estadoPago={o.estadoPago} />
                <InsigniaEstado estado={o.estado} />
              </div>
            </div>

            {/* Cliente y método de pago. */}
            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-marron-600">
              <span>👤 {o.clienteNombre}</span>
              <span>📧 {o.clienteEmail}</span>
              <span>💳 {o.metodoPago === "tarjeta" ? "Tarjeta" : "Contra entrega"}</span>
              <span>📞 {o.telefono}</span>
            </div>

            {/* Dirección de envío. */}
            <p className="mt-2 text-sm text-marron-500">📍 {o.direccionEnvio}</p>

            {/* Seguimiento asignado. */}
            {o.numeroSeguimiento ? (
              <div className="mt-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">
                🚚 Paquetería: <strong>{o.paqueteria}</strong> · Seguimiento:{" "}
                <strong>{o.numeroSeguimiento}</strong>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => abrirSeguimiento(o)}
                className="mt-2 rounded-lg border border-marron-200 px-3 py-1.5 text-sm font-medium text-marron-700 hover:bg-marron-50"
              >
                + Asignar seguimiento
              </button>
            )}

            {/* Artículos y total. */}
            <div className="mt-3 border-t border-marron-50 pt-3">
              <ul className="space-y-1 text-sm text-marron-600">
                {o.items.map((l, i) => (
                  <li key={i} className="flex justify-between gap-2">
                    <span>
                      {l.nombre} <span className="text-marron-400">×{l.cantidad}</span>
                      <span className="ml-2 text-xs text-marron-400">{l.variante}</span>
                    </span>
                    <span className="font-medium">{formatearPrecio(l.subtotal)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex justify-between border-t border-marron-50 pt-2 font-semibold text-marron-900">
                <span>Total (envío incluido)</span>
                <span>{formatearPrecio(o.total)}</span>
              </div>
            </div>
          </div>
        ))}

        {filtrados.length === 0 && (
          <p className="rounded-xl border border-dashed border-marron-200 bg-white py-10 text-center text-marron-500">
            No hay pedidos para este estado.
          </p>
        )}
      </div>

      {/* Modal de asignación de seguimiento. */}
      {pedidoEdicion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h2 className="mb-4 font-display text-lg font-bold text-marron-900">
              Asignar seguimiento · {pedidoEdicion.id}
            </h2>
            <form onSubmit={guardarSeguimiento} className="space-y-4">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-marron-700">Paquetería / proveedor</span>
                <input
                  value={paqueteria}
                  onChange={(e) => setPaqueteria(e.target.value)}
                  required
                  placeholder="Ej. Guatex, Cargo Expreso, DHL…"
                  className="w-full rounded-lg border border-marron-200 px-3 py-2 outline-none focus:border-marron-500"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-marron-700">Número de seguimiento</span>
                <input
                  value={numeroSeguimiento}
                  onChange={(e) => setNumeroSeguimiento(e.target.value)}
                  required
                  placeholder="Número de guía"
                  className="w-full rounded-lg border border-marron-200 px-3 py-2 outline-none focus:border-marron-500"
                />
              </label>

              <p className="text-xs text-marron-500">
                Al guardar, el pedido cambiará a estado <strong>Enviado</strong> y se notificará al
                cliente por correo.
              </p>

              {error && (
                <p className="rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700">{error}</p>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={guardando}
                  className="rounded-full bg-marron-700 px-6 py-2 text-sm font-semibold text-white hover:bg-marron-800 disabled:opacity-60"
                >
                  {guardando ? "Guardando…" : "Guardar"}
                </button>
                <button
                  type="button"
                  onClick={() => setPedidoEdicion(null)}
                  className="rounded-full border border-marron-200 px-6 py-2 text-sm font-medium text-marron-700 hover:bg-marron-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
