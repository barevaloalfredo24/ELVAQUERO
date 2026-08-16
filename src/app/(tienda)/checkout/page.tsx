// =====================================================================
// PÁGINA DE CHECKOUT (PAGO)
// ---------------------------------------------------------------------
// Componente cliente. Regla de negocio: la compra SOLO está disponible
// para usuarios autenticados. Permite elegir método de pago (tarjeta vía
// Stripe -simulado- o pago contra entrega) y generar la orden.
// La confirmación real del pago con tarjeta se hará por webhook en el
// backend; aquí solo se simula el flujo.
// =====================================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/contexto/auth";
import { useCarrito } from "@/lib/contexto/carrito";
import { formatearPrecio } from "@/lib/util";
import type { MetodoPago, Orden } from "@/lib/tipos";

const ENVIO = 45;
const UMBRAL_ENVIO_GRATIS = 500;
const CLAVE_ORDENES = "elvaquero-ordenes";

export default function PaginaCheckout() {
  const { usuario, autenticado } = useAuth();
  const { lineas, subtotal, vaciar } = useCarrito();
  const router = useRouter();

  // Estado del formulario.
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("contra_entrega");
  const [nombre, setNombre] = useState(usuario?.nombre ?? "");
  const [telefono, setTelefono] = useState(usuario?.telefono ?? "");
  const [direccion, setDireccion] = useState(usuario?.direccion ?? "");
  const [error, setError] = useState("");

  const envio = subtotal >= UMBRAL_ENVIO_GRATIS ? 0 : ENVIO;
  const total = subtotal + envio;

  // -------- GATE: requiere sesión iniciada --------
  if (!autenticado) {
    return (
      <div className="contenedor flex flex-col items-center gap-4 py-20 text-center">
        <span className="text-6xl">🔐</span>
        <h1 className="font-display text-2xl font-bold text-marron-900">
          Inicia sesión para comprar
        </h1>
        <p className="max-w-md text-marron-500">
          Para completar tu pedido necesitas iniciar sesión o crear una cuenta.
        </p>
        <Link
          href="/login?redirigir=/checkout"
          className="mt-2 rounded-full bg-marron-700 px-6 py-3 font-semibold text-white transition hover:bg-marron-800"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  // -------- GATE: carrito no vacío --------
  if (lineas.length === 0) {
    return (
      <div className="contenedor flex flex-col items-center gap-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-marron-900">No hay productos</h1>
        <p className="text-marron-500">Tu carrito está vacío.</p>
        <Link href="/catalogo" className="rounded-full bg-marron-700 px-6 py-3 font-semibold text-white">
          Ir al catálogo
        </Link>
      </div>
    );
  }

  // -------- Genera la orden y redirige a la confirmación --------
  function confirmarPedido(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    // Validación básica de campos de envío.
    if (!nombre.trim() || !telefono.trim() || !direccion.trim()) {
      setError("Completa todos los campos de envío para continuar.");
      return;
    }

    // Construye la orden con un "snapshot" de las líneas del carrito.
    const orden: Orden = {
      id: `ORD-${Date.now()}`,
      clienteId: usuario!.id,
      clienteNombre: nombre.trim(),
      clienteEmail: usuario!.email,
      items: lineas.map((l) => ({
        productoId: l.productoId,
        nombre: l.nombre,
        variante: `Talla ${l.talla} · ${l.color}`,
        cantidad: l.cantidad,
        precioUnitario: l.precioUnitario,
        subtotal: l.precioUnitario * l.cantidad,
      })),
      subtotal,
      envio,
      total,
      metodoPago,
      // Si es contra entrega, el estado inicial es "pago_pendiente".
      estado: metodoPago === "tarjeta" ? "pendiente" : "pago_pendiente",
      direccionEnvio: direccion.trim(),
      telefono: telefono.trim(),
      fecha: new Date().toISOString(),
    };

    // Persiste la orden en localStorage (historial local del usuario).
    try {
      const guardadas: Orden[] = JSON.parse(localStorage.getItem(CLAVE_ORDENES) ?? "[]");
      guardadas.unshift(orden);
      localStorage.setItem(CLAVE_ORDENES, JSON.stringify(guardadas));
    } catch {
      // Si falla el almacenamiento, se continúa igualmente.
    }

    // Limpia el carrito y navega a la confirmación.
    vaciar();
    router.push(`/gracias?orden=${orden.id}`);
  }

  return (
    <div className="contenedor py-8">
      <h1 className="mb-6 font-display text-2xl font-bold text-marron-900 sm:text-3xl">
        Finalizar compra
      </h1>

      {/* Aviso si el correo aún no está verificado (el backend lo exigirá). */}
      {!usuario?.verificado && (
        <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          Tu correo aún no está verificado. Podrás pagar una vez que confirmes el enlace enviado a{" "}
          <strong>{usuario?.email}</strong>. (En esta fase de frontend el bloqueo no es estricto.)
        </div>
      )}

      <form onSubmit={confirmarPedido} className="flex flex-col gap-8 lg:flex-row">
        {/* ============ COLUMNA IZQUIERDA: DATOS Y PAGO ============ */}
        <div className="flex-1 space-y-6">
          {/* Datos de envío. */}
          <section className="rounded-xl border border-marron-100 bg-white p-5">
            <h2 className="mb-4 font-display text-lg font-bold text-marron-900">Datos de envío</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-marron-700">Nombre completo</span>
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full rounded-lg border border-marron-200 px-3 py-2 outline-none focus:border-marron-500"
                  placeholder="Tu nombre"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-marron-700">Teléfono</span>
                <input
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full rounded-lg border border-marron-200 px-3 py-2 outline-none focus:border-marron-500"
                  placeholder="+502 …"
                />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block font-medium text-marron-700">Dirección de entrega</span>
                <textarea
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-marron-200 px-3 py-2 outline-none focus:border-marron-500"
                  placeholder="Zona, ciudad, referencias…"
                />
              </label>
            </div>
          </section>

          {/* Método de pago. */}
          <section className="rounded-xl border border-marron-100 bg-white p-5">
            <h2 className="mb-4 font-display text-lg font-bold text-marron-900">Método de pago</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Opción: contra entrega. */}
              <button
                type="button"
                onClick={() => setMetodoPago("contra_entrega")}
                className={`flex items-start gap-3 rounded-lg border p-4 text-left transition ${
                  metodoPago === "contra_entrega"
                    ? "border-marron-700 bg-marron-50"
                    : "border-marron-200 hover:border-marron-400"
                }`}
              >
                <span className="text-2xl">💵</span>
                <span>
                  <span className="block font-semibold text-marron-900">Pago contra entrega</span>
                  <span className="text-sm text-marron-500">
                    Paga en efectivo al recibir tu pedido.
                  </span>
                </span>
              </button>

              {/* Opción: tarjeta (Stripe). */}
              <button
                type="button"
                onClick={() => setMetodoPago("tarjeta")}
                className={`flex items-start gap-3 rounded-lg border p-4 text-left transition ${
                  metodoPago === "tarjeta"
                    ? "border-marron-700 bg-marron-50"
                    : "border-marron-200 hover:border-marron-400"
                }`}
              >
                <span className="text-2xl">💳</span>
                <span>
                  <span className="block font-semibold text-marron-900">Tarjeta (Stripe)</span>
                  <span className="text-sm text-marron-500">
                    Pago seguro con tarjeta de crédito o débito.
                  </span>
                </span>
              </button>
            </div>

            {/* Nota según el método elegido. */}
            {metodoPago === "tarjeta" ? (
              <p className="mt-3 text-sm text-marron-500">
                Serás redirigido al checkout seguro de Stripe (simulado en esta fase).
              </p>
            ) : (
              <p className="mt-3 text-sm text-marron-500">
                Recuerda tener el efectivo disponible y un teléfono de contacto al momento de la
                entrega.
              </p>
            )}
          </section>

          {/* Error de validación. */}
          {error && (
            <p className="rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700">{error}</p>
          )}
        </div>

        {/* ============ COLUMNA DERECHA: RESUMEN ============ */}
        <aside className="lg:w-96">
          <div className="sticky top-28 space-y-4 rounded-xl border border-marron-100 bg-white p-5 shadow-sm">
            <h2 className="font-display text-lg font-bold text-marron-900">Tu pedido</h2>
            <ul className="space-y-2 border-b border-marron-100 pb-3 text-sm">
              {lineas.map((l) => (
                <li key={`${l.productoId}-${l.varianteId}`} className="flex justify-between gap-2">
                  <span className="text-marron-600">
                    {l.nombre} <span className="text-marron-400">×{l.cantidad}</span>
                  </span>
                  <span className="font-medium">{formatearPrecio(l.precioUnitario * l.cantidad)}</span>
                </li>
              ))}
            </ul>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-marron-500">Subtotal</span>
                <span>{formatearPrecio(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-marron-500">Envío</span>
                <span>{envio === 0 ? "Gratis" : formatearPrecio(envio)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-marron-900">
                <span>Total</span>
                <span>{formatearPrecio(total)}</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-marron-700 py-3 font-semibold text-white transition hover:bg-marron-800"
            >
              {metodoPago === "tarjeta" ? "Pagar con tarjeta" : "Confirmar pedido"}
            </button>
          </div>
        </aside>
      </form>
    </div>
  );
}
