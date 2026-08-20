// =====================================================================
// PÁGINA DE RECUPERACIÓN DE CONTRASEÑA
// ---------------------------------------------------------------------
// Paso 1: solicita un código al correo. Paso 2: ingresa el código y la
// nueva contraseña. En desarrollo el código se muestra en pantalla (en
// producción se enviaría por email).
// =====================================================================

"use client";

import { useState } from "react";
import Link from "next/link";
import { API_URL } from "@/lib/api";
import { CampoContrasena } from "@/components/tienda/CampoContrasena";

export default function PaginaRecuperar() {
  const [paso, setPaso] = useState<"email" | "codigo">("email");
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [codigoDev, setCodigoDev] = useState("");
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const [listo, setListo] = useState(false);

  // Paso 1: solicita el código de recuperación.
  async function solicitarCodigo(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setCargando(true);
    setError("");
    setMensaje("");
    try {
      const res = await fetch(`${API_URL}/api/auth/olvidar-contrasena`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        // En desarrollo el backend devuelve el código para pruebas.
        if (data.codigoDev) setCodigoDev(data.codigoDev);
        setMensaje("Se generó un código de recuperación. Revísalo y continúa.");
        setPaso("codigo");
      } else {
        setError(data?.message ?? "No se pudo solicitar el código.");
      }
    } catch {
      setError("Error de conexión con el backend.");
    } finally {
      setCargando(false);
    }
  }

  // Paso 2: restablece la contraseña con el código.
  async function restablecer(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (nuevaContrasena !== confirmacion) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setCargando(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/auth/restablecer-contrasena`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, codigo, nuevaContrasena }),
      });
      const data = await res.json();
      if (res.ok) {
        setListo(true);
      } else {
        setError(data?.message ?? "No se pudo restablecer la contraseña.");
      }
    } catch {
      setError("Error de conexión con el backend.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="contenedor flex justify-center py-12">
      <div className="w-full max-w-md rounded-2xl border border-marron-100 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <span className="text-4xl">🔑</span>
          <h1 className="mt-2 font-display text-2xl font-bold text-marron-900">
            Recuperar contraseña
          </h1>
          <p className="mt-1 text-sm text-marron-500">
            Te enviaremos un código para restablecerla
          </p>
        </div>

        {listo ? (
          <div className="text-center">
            <p className="rounded-lg bg-green-100 px-3 py-2 text-sm font-medium text-green-800">
              Contraseña restablecida correctamente.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-block rounded-full bg-marron-700 px-6 py-3 font-semibold text-white hover:bg-marron-800"
            >
              Iniciar sesión
            </Link>
          </div>
        ) : paso === "email" ? (
          <form onSubmit={solicitarCodigo} className="space-y-4">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-marron-700">Correo electrónico</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-lg border border-marron-200 px-3 py-2 outline-none focus:border-marron-500"
                placeholder="tucorreo@ejemplo.com"
              />
            </label>

            {error && (
              <p className="rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700">{error}</p>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="w-full rounded-full bg-marron-700 py-3 font-semibold text-white transition hover:bg-marron-800 disabled:opacity-60"
            >
              {cargando ? "Enviando…" : "Enviar código"}
            </button>
          </form>
        ) : (
          <form onSubmit={restablecer} className="space-y-4">
            {mensaje && (
              <p className="rounded-lg bg-blue-100 px-3 py-2 text-sm font-medium text-blue-700">{mensaje}</p>
            )}
            {codigoDev && (
              <p className="rounded-lg border border-dashed border-dorado bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Código de prueba (desarrollo): <strong>{codigoDev}</strong>
              </p>
            )}
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-marron-700">Código de recuperación</span>
              <input
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                required
                inputMode="numeric"
                maxLength={6}
                className="w-full rounded-lg border border-marron-200 px-3 py-2 text-center text-lg tracking-widest outline-none focus:border-marron-500"
                placeholder="••••••"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-marron-700">Nueva contraseña</span>
              <CampoContrasena
                value={nuevaContrasena}
                onChange={setNuevaContrasena}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-marron-700">Confirmar contraseña</span>
              <CampoContrasena
                value={confirmacion}
                onChange={setConfirmacion}
                required
                autoComplete="new-password"
              />
            </label>

            {error && (
              <p className="rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700">{error}</p>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="w-full rounded-full bg-marron-700 py-3 font-semibold text-white transition hover:bg-marron-800 disabled:opacity-60"
            >
              {cargando ? "Restableciendo…" : "Restablecer contraseña"}
            </button>

            <button
              type="button"
              onClick={() => setPaso("email")}
              className="w-full text-center text-sm font-medium text-marron-600 hover:underline"
            >
              ← Volver a enviar código
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-marron-500">
          ¿Ya la recordaste?{" "}
          <Link href="/login" className="font-semibold text-marron-700 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
