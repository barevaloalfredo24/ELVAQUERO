// =====================================================================
// PÁGINA DE CHECKOUT (PAGO)
// ---------------------------------------------------------------------
// Componente cliente. Regla de negocio: la compra SOLO está disponible
// para usuarios autenticados. Permite elegir método de pago (tarjeta vía
// Recurrente -embebido- o pago contra entrega) y generar la orden.
// =====================================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/contexto/auth";
import { useCarrito } from "@/lib/contexto/carrito";
import { formatearPrecio } from "@/lib/util";
import { API_URL } from "@/lib/api";
import { PagoRecurrente } from "@/components/tienda/PagoRecurrente";
import { DEPARTAMENTOS_GUATEMALA } from "@/lib/departamentos";
import type { Cupon, MetodoPago, Orden } from "@/lib/tipos";

const ENVIO = 45;
const UMBRAL_ENVIO_GRATIS = 500;
const CLAVE_ORDENES = "elvaquero-ordenes";

export default function PaginaCheckout() {
  const { usuario, token, autenticado, esStaff } = useAuth();
  const { lineas, subtotal, vaciar } = useCarrito();
  const router = useRouter();

  // Estado del formulario.
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("contra_entrega");
  const [nombre, setNombre] = useState(usuario?.nombre ?? "");
  const [telefono, setTelefono] = useState(usuario?.telefono ?? "");
  const [direccion, setDireccion] = useState(usuario?.direccion ?? "");
  const [departamento, setDepartamento] = useState("Guatemala");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Estado del cupón.
  const [cuponCodigo, setCuponCodigo] = useState("");
  const [cuponAplicado, setCuponAplicado] = useState<Cupon | null>(null);
  const [descuento, setDescuento] = useState(0);
  const [cuponError, setCuponError] = useState("");
  const [aplicandoCupon, setAplicandoCupon] = useState(false);

  // Estado del pago con Recurrente (tarjeta).
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [ordenRecurrenteId, setOrdenRecurrenteId] = useState<string | null>(null);

  const envio = subtotal >= UMBRAL_ENVIO_GRATIS ? 0 : ENVIO;
  const total = subtotal - descuento + envio;

  // -------- GATE: los usuarios de staff no pueden realizar pedidos --------
  if (autenticado && esStaff) {
    return (
      <div className="contenedor flex flex-col items-center gap-4 py-20 text-center">
        <span className="text-6xl">🚫</span>
        <h1 className="font-display text-2xl font-bold text-marron-900">
          No puedes realizar pedidos
        </h1>
        <p className="max-w-md text-marron-500">
          Tu cuenta es de staff y solo tiene acceso a la gestión de productos. Ve al panel de
          administración para gestionar el catálogo.
        </p>
        <Link
          href="/admin/productos"
          className="mt-2 rounded-full bg-marron-700 px-6 py-3 font-semibold text-white transition hover:bg-marron-800"
        >
          Ir al panel de administración
        </Link>
      </div>
    );
  }

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

  // -------- VISTA DE PAGO EMBEBIDO (Recurrente) --------
  if (checkoutUrl) {
    return (
      <div className="contenedor py-8">
        <h1 className="mb-2 font-display text-2xl font-bold text-marron-900 sm:text-3xl">
          Pago con tarjeta
        </h1>
        <p className="mb-6 text-sm text-marron-500">
          Completa el pago de forma segura. Total a pagar:{" "}
          <strong className="text-marron-900">{formatearPrecio(total)}</strong>
        </p>
        <PagoRecurrente
          url={checkoutUrl}
          onExito={manejarExitoRecurrente}
          onFallo={manejarFalloRecurrente}
        />
      </div>
    );
  }

  // -------- Valida y aplica el cupón --------
  async function aplicarCupon() {
    if (!cuponCodigo.trim()) return;
    setCuponError("");
    setAplicandoCupon(true);
    try {
      const res = await fetch(`${API_URL}/api/catalogo/cupones/validar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: cuponCodigo.trim(), subtotal }),
      });
      const data = await res.json();
      if (data.valido) {
        setCuponAplicado(data.cupon);
        setDescuento(data.descuento);
      } else {
        setCuponAplicado(null);
        setDescuento(0);
        setCuponError(data.mensaje ?? "Cupón no válido.");
      }
    } catch {
      setCuponError("No se pudo validar el cupón.");
    } finally {
      setAplicandoCupon(false);
    }
  }

  // Quita el cupón aplicado.
  function quitarCupon() {
    setCuponCodigo("");
    setCuponAplicado(null);
    setDescuento(0);
    setCuponError("");
  }

  // -------- Genera la orden y redirige a la confirmación --------
  async function confirmarPedido(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    // Validación básica de campos de envío.
    if (!nombre.trim() || !telefono.trim() || !direccion.trim()) {
      setError("Completa todos los campos de envío para continuar.");
      return;
    }
    setError("");
    setEnviando(true);

    try {
      // Si elige tarjeta, inicia el checkout embebido de Recurrente.
      if (metodoPago === "tarjeta") {
        const resultado = await crearCheckoutRecurrente();
        if (resultado) {
          guardarOrdenLocal(resultado.orden);
          setOrdenRecurrenteId(resultado.ordenId);
          setCheckoutUrl(resultado.checkoutUrl);
        }
        return;
      }

      // Contra entrega: crea la orden directamente.
      if (token) {
        const creada = await crearOrdenEnApi();
        if (creada) {
          guardarOrdenLocal(creada);
          vaciar();
          router.push(`/gracias?orden=${creada.id}`);
          return;
        }
      }

      // Respaldo local (sin backend o sin token).
      const orden = construirOrdenLocal();
      guardarOrdenLocal(orden);
      vaciar();
      router.push(`/gracias?orden=${orden.id}`);
    } finally {
      setEnviando(false);
    }
  }

  // Crea la orden + el checkout de Recurrente y devuelve la URL a embebir.
  async function crearCheckoutRecurrente(): Promise<{
    ordenId: string;
    checkoutUrl: string;
    orden: Orden;
  } | null> {
    if (!token) return null;
    try {
      const res = await fetch(`${API_URL}/api/pagos/recurrente/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: lineas.map((l) => ({ varianteId: l.varianteId, cantidad: l.cantidad })),
          metodoPago: "tarjeta",
          direccionEnvio: direccion.trim(),
          departamento,
          telefono: telefono.trim(),
          cuponCodigo: cuponAplicado?.codigo ?? undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.message ?? "No se pudo iniciar el pago.");
        return null;
      }
      return (await res.json()) as { ordenId: string; checkoutUrl: string; orden: Orden };
    } catch {
      setError("No se pudo iniciar el pago con Recurrente.");
      return null;
    }
  }

  // Al completarse el pago, confirma y redirige a la página de gracias.
  async function manejarExitoRecurrente() {
    if (ordenRecurrenteId && token) {
      await fetch(`${API_URL}/api/pagos/recurrente/confirmar`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ordenId: ordenRecurrenteId }),
      }).catch(() => {});
    }
    vaciar();
    router.push(`/gracias?orden=${ordenRecurrenteId}`);
  }

  // Si el pago falla, permite reintentar.
  function manejarFalloRecurrente() {
    setCheckoutUrl(null);
    setError("El pago no se completó. Intenta de nuevo.");
  }

  // Crea la orden en el backend vía POST /api/ordenes.
  async function crearOrdenEnApi(): Promise<Orden | null> {
    if (!token) return null;
    try {
      const res = await fetch(`${API_URL}/api/ordenes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: lineas.map((l) => ({ varianteId: l.varianteId, cantidad: l.cantidad })),
          metodoPago,
          direccionEnvio: direccion.trim(),
          departamento,
          telefono: telefono.trim(),
          cuponCodigo: cuponAplicado?.codigo ?? undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.message ?? "No se pudo crear el pedido.");
        return null;
      }
      return (await res.json()) as Orden;
    } catch {
      return null;
    }
  }

  // Construye una orden local (snapshot) como respaldo.
  function construirOrdenLocal(): Orden {
    return {
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
      descuento,
      envio,
      total,
      metodoPago,
      estado: metodoPago === "tarjeta" ? "pendiente" : "pago_pendiente",
      direccionEnvio: direccion.trim(),
      departamento,
      telefono: telefono.trim(),
      fecha: new Date().toISOString(),
    };
  }

  // Guarda la orden en el historial local (para "gracias" y "mi cuenta").
  function guardarOrdenLocal(orden: Orden) {
    try {
      const guardadas: Orden[] = JSON.parse(localStorage.getItem(CLAVE_ORDENES) ?? "[]");
      guardadas.unshift(orden);
      localStorage.setItem(CLAVE_ORDENES, JSON.stringify(guardadas));
    } catch {
      // Si falla el almacenamiento, se continúa igualmente.
    }
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
                  type="tel"
                  inputMode="numeric"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  maxLength={8}
                  className="w-full rounded-lg border border-marron-200 px-3 py-2 outline-none focus:border-marron-500"
                  placeholder="Ej. 58608456"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-marron-700">Departamento</span>
                <select
                  value={departamento}
                  onChange={(e) => setDepartamento(e.target.value)}
                  className="w-full rounded-lg border border-marron-200 bg-white px-3 py-2 outline-none focus:border-marron-500"
                >
                  {DEPARTAMENTOS_GUATEMALA.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
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

              {/* Opción: tarjeta (Recurrente). */}
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
                  <span className="block font-semibold text-marron-900">Tarjeta (Recurrente)</span>
                  <span className="text-sm text-marron-500">
                    Pago seguro con tarjeta de crédito o débito.
                  </span>
                </span>
              </button>
            </div>

            {/* Nota según el método elegido. */}
            {metodoPago === "tarjeta" ? (
              <p className="mt-3 text-sm text-marron-500">
                Se abrirá el pago seguro de Recurrente en esta misma página.
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
            {/* Cupón de descuento. */}
            <div className="border-b border-marron-100 pb-3">
              {cuponAplicado ? (
                <div className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2 text-sm">
                  <span className="font-medium text-green-800">
                    🎟️ {cuponAplicado.codigo} aplicado
                  </span>
                  <button
                    type="button"
                    onClick={quitarCupon}
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    Quitar
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={cuponCodigo}
                      onChange={(e) => setCuponCodigo(e.target.value.toUpperCase())}
                      placeholder="Código de cupón"
                      className="w-full rounded-lg border border-marron-200 px-3 py-2 text-sm uppercase outline-none focus:border-marron-500"
                    />
                    <button
                      type="button"
                      onClick={aplicarCupon}
                      disabled={aplicandoCupon}
                      className="shrink-0 rounded-lg bg-marron-100 px-4 py-2 text-sm font-semibold text-marron-700 hover:bg-marron-200 disabled:opacity-60"
                    >
                      {aplicandoCupon ? "…" : "Aplicar"}
                    </button>
                  </div>
                  {cuponError && (
                    <p className="mt-1 text-xs font-medium text-red-600">{cuponError}</p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-marron-500">Subtotal</span>
                <span>{formatearPrecio(subtotal)}</span>
              </div>
              {descuento > 0 && (
                <div className="flex justify-between font-medium text-green-700">
                  <span>Descuento</span>
                  <span>−{formatearPrecio(descuento)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-marron-500">Envío</span>
                <span>{envio === 0 ? "Gratis" : formatearPrecio(envio)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-marron-900">
                <span>Total</span>
                <span>{formatearPrecio(total)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Link
                href="/catalogo"
                className="shrink-0 rounded-full border border-marron-200 px-4 py-3 text-center text-sm font-medium text-marron-700 transition hover:bg-marron-50"
              >
                Regresar
              </Link>
              <button
                type="submit"
                disabled={enviando}
                className="w-full rounded-full bg-marron-700 py-3 font-semibold text-white transition hover:bg-marron-800 disabled:opacity-60"
              >
                {enviando
                  ? "Procesando…"
                  : metodoPago === "tarjeta"
                    ? "Pagar con tarjeta"
                    : "Confirmar pedido"}
              </button>
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
}
