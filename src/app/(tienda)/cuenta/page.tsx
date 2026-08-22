// =====================================================================
// PÁGINA "MI CUENTA"
// ---------------------------------------------------------------------
// Componente cliente. Muestra los datos de la sesión y el historial de
// pedidos del usuario autenticado, leyendo SIEMPRE desde la API para
// reflejar el estado real (pagado, enviado, seguimiento...).
// =====================================================================

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/contexto/auth";
import { peticionAuth } from "@/lib/api";
import { formatearFecha, formatearPrecio } from "@/lib/util";
import type { Orden } from "@/lib/tipos";

// Etiqueta amigable para cada estado de la orden (envío).
const ETIQUETAS_ESTADO: Record<string, string> = {
  pendiente: "Pendiente",
  pago_pendiente: "Pago contra entrega",
  pagada: "Pagada",
  enviada: "Enviada",
  entregada: "Entregada",
  cancelada: "Cancelada",
};

// Etiqueta y estilo del estado de pago.
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

export default function PaginaCuenta() {
  const { usuario, autenticado, token, cerrarSesion } = useAuth();
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [cargando, setCargando] = useState(true);
  const [detalleId, setDetalleId] = useState<string | null>(null);

  // Carga SOLO los pedidos del usuario autenticado desde la API.
  useEffect(() => {
    if (!token) return;
    let activo = true;
    peticionAuth<Orden[]>("/api/ordenes/mis", token).then((res) => {
      if (!activo) return;
      if (res.ok && res.data) setOrdenes(res.data);
      setCargando(false);
    });
    return () => {
      activo = false;
    };
  }, [token]);

  if (!autenticado) {
    return (
      <div className="contenedor flex flex-col items-center gap-4 py-20 text-center">
        <span className="text-6xl">🔐</span>
        <h1 className="font-display text-2xl font-bold text-marron-900">Inicia sesión</h1>
        <p className="text-marron-500">Accede a tu cuenta para ver tu información y pedidos.</p>
        <Link href="/login" className="rounded-full bg-marron-700 px-6 py-3 font-semibold text-white">
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="contenedor py-8">
      <h1 className="mb-6 font-display text-2xl font-bold text-marron-900 sm:text-3xl">Mi cuenta</h1>

      {/* Tarjeta de perfil. */}
      <section className="rounded-xl border border-marron-100 bg-white p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-semibold text-marron-900">{usuario?.nombre}</p>
            <p className="text-sm text-marron-500">{usuario?.email}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {/* Estado de verificación. */}
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  usuario?.verificado
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {usuario?.verificado ? "Correo verificado" : "Correo sin verificar"}
              </span>
              {/* Método de registro. */}
              <span className="rounded-full bg-marron-100 px-2.5 py-1 text-xs font-medium text-marron-700">
                {usuario?.metodoRegistro === "google" ? "Registro con Google" : "Registro con correo"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={cerrarSesion}
            className="self-start rounded-full border border-marron-200 px-5 py-2 text-sm font-medium text-marron-700 hover:bg-marron-50"
          >
            Cerrar sesión
          </button>
        </div>
      </section>

      {/* Historial de pedidos. */}
      <section className="mt-8">
        <h2 className="mb-4 font-display text-xl font-bold text-marron-900">Mis pedidos</h2>
        {cargando ? (
          <div className="rounded-xl border border-dashed border-marron-200 bg-white py-12 text-center text-marron-500">
            Cargando tus pedidos…
          </div>
        ) : ordenes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-marron-200 bg-white py-12 text-center">
            <p className="text-marron-500">Aún no has realizado ningún pedido.</p>
            <Link
              href="/catalogo"
              className="mt-3 inline-block rounded-full bg-marron-700 px-5 py-2 text-sm font-semibold text-white"
            >
              Ir de compras
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {ordenes.map((o) => (
              <div key={o.id} className="rounded-xl border border-marron-100 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-semibold text-marron-900">{o.id}</span>
                    <span className="ml-2 text-sm text-marron-500">{formatearFecha(o.fecha)}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Estado de pago. */}
                    <InsigniaPago estadoPago={o.estadoPago} />
                    {/* Estado de la orden (envío). */}
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        o.estado === "cancelada"
                          ? "bg-red-100 text-red-700"
                          : o.estado === "entregada"
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {ETIQUETAS_ESTADO[o.estado] ?? o.estado}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-marron-600">
                  {o.items.reduce((acc, l) => acc + l.cantidad, 0)} artículo(s) ·{" "}
                  {o.metodoPago === "tarjeta" ? "Tarjeta" : "Contra entrega"}
                </p>

                {/* Detalle expandible. */}
                {detalleId === o.id && (
                  <div className="mt-3 rounded-lg bg-marron-50 p-3 text-sm">
                    <p className="text-marron-600">
                      📍 {o.direccionEnvio}
                      {o.departamento ? `, ${o.departamento}` : ""}
                    </p>
                    <ul className="mt-2 space-y-1">
                      {o.items.map((l, i) => (
                        <li key={i} className="flex justify-between gap-2 text-marron-700">
                          <span>
                            {l.nombre} <span className="text-marron-400">×{l.cantidad}</span>
                            <span className="ml-1 text-xs text-marron-400">{l.variante}</span>
                          </span>
                          <span className="font-medium">{formatearPrecio(l.subtotal)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2 flex justify-between border-t border-marron-100 pt-2">
                      <span>Subtotal</span>
                      <span>{formatearPrecio(o.subtotal)}</span>
                    </div>
                    {o.descuento > 0 && (
                      <div className="flex justify-between text-green-700">
                        <span>Descuento</span>
                        <span>−{formatearPrecio(o.descuento)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Envío</span>
                      <span>{o.envio === 0 ? "Gratis" : formatearPrecio(o.envio)}</span>
                    </div>
                  </div>
                )}

                {/* Seguimiento del envío (si ya fue enviado). */}
                {o.numeroSeguimiento && (
                  <div className="mt-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">
                    🚚 En camino · Paquetería: <strong>{o.paqueteria}</strong> · Seguimiento:{" "}
                    <strong>{o.numeroSeguimiento}</strong>
                  </div>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setDetalleId((id) => (id === o.id ? null : o.id))}
                    className="text-sm font-medium text-marron-600 hover:underline"
                  >
                    {detalleId === o.id ? "Ocultar detalle" : "Ver detalle"}
                  </button>
                  <p className="font-semibold text-marron-900">
                    Total: {formatearPrecio(o.total)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
