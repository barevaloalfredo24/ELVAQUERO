// =====================================================================
// PÁGINA "MI CUENTA"
// ---------------------------------------------------------------------
// Componente cliente. Muestra los datos de la sesión, el estado de
// verificación del correo y el historial local de pedidos del usuario
// (guardado en localStorage durante esta fase de frontend).
// =====================================================================

"use client";

import Link from "next/link";
import { useAuth } from "@/lib/contexto/auth";
import { useAlmacenLocal } from "@/lib/hooks/use-almacen-local";
import { formatearFecha, formatearPrecio } from "@/lib/util";
import type { Orden } from "@/lib/tipos";

const CLAVE_ORDENES = "elvaquero-ordenes";
const ORDENES_VACIAS: Orden[] = [];

// Etiqueta amigable para cada estado de orden.
const ETIQUETAS_ESTADO: Record<string, string> = {
  pendiente: "Pendiente",
  pago_pendiente: "Pago contra entrega",
  pagada: "Pagada",
  enviada: "Enviada",
  entregada: "Entregada",
  cancelada: "Cancelada",
};

export default function PaginaCuenta() {
  const { usuario, autenticado, cerrarSesion } = useAuth();
  // Historial local de pedidos (persistido en localStorage).
  const [ordenes] = useAlmacenLocal<Orden[]>(CLAVE_ORDENES, ORDENES_VACIAS);

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
        {ordenes.length === 0 ? (
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
                <p className="mt-2 text-sm text-marron-600">
                  {o.items.reduce((acc, l) => acc + l.cantidad, 0)} artículo(s) ·{" "}
                  {o.metodoPago === "tarjeta" ? "Tarjeta" : "Contra entrega"}
                </p>
                <p className="mt-1 text-right font-semibold text-marron-900">
                  Total: {formatearPrecio(o.total)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
