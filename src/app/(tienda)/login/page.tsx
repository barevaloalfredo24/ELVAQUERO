// =====================================================================
// PÁGINA DE INICIO DE SESIÓN
// ---------------------------------------------------------------------
// Componente cliente. Permite iniciar sesión con email/contraseña o con
// la cuenta de Google, y enlaza a la recuperación de contraseña.
// =====================================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/contexto/auth";
import { BotonGoogle } from "@/components/tienda/BotonGoogle";
import { CampoContrasena } from "@/components/tienda/CampoContrasena";

export default function PaginaLogin() {
  const { iniciarSesion, iniciarSesionGoogle } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  // Redirige al destino pedido o a "Mi cuenta".
  function redirigir() {
    const destino = new URLSearchParams(window.location.search).get("redirigir");
    router.push(destino ?? "/cuenta");
  }

  // Envío del formulario de email/contraseña.
  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setCargando(true);
    setError("");
    const resultado = await iniciarSesion(email, password);
    setCargando(false);
    if (resultado.ok) redirigir();
    else setError(resultado.mensaje ?? "No se pudo iniciar sesión.");
  }

  // Login con Google (recibe el ID token desde el botón).
  async function manejarGoogle(credential: string) {
    setCargando(true);
    setError("");
    const resultado = await iniciarSesionGoogle(credential);
    setCargando(false);
    if (resultado.ok) redirigir();
    else setError(resultado.mensaje ?? "No se pudo iniciar sesión con Google.");
  }

  return (
    <div className="contenedor flex justify-center py-12">
      <div className="w-full max-w-md rounded-2xl border border-marron-100 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <span className="text-4xl">🤠</span>
          <h1 className="mt-2 font-display text-2xl font-bold text-marron-900">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-marron-500">Bienvenido de vuelta a El Vaquero</p>
        </div>

        <form onSubmit={enviar} className="space-y-4">
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
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-marron-700">Contraseña</span>
            <CampoContrasena
              value={password}
              onChange={setPassword}
              required
              autoComplete="current-password"
            />
          </label>

          {/* Enlace de recuperación de contraseña. */}
          <div className="text-right">
            <Link
              href="/recuperar-contrasena"
              className="text-sm font-medium text-marron-600 hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {error && (
            <p className="rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-full bg-marron-700 py-3 font-semibold text-white transition hover:bg-marron-800 disabled:opacity-60"
          >
            {cargando ? "Ingresando…" : "Iniciar sesión"}
          </button>
        </form>

        {/* Separador. */}
        <div className="my-4 flex items-center gap-3 text-xs text-marron-400">
          <span className="h-px flex-1 bg-marron-100" /> o <span className="h-px flex-1 bg-marron-100" />
        </div>

        {/* Botón Google (OAuth real). */}
        <BotonGoogle onCredential={manejarGoogle} />

        <p className="mt-6 text-center text-sm text-marron-500">
          ¿No tienes cuenta?{" "}
          <Link href="/registro" className="font-semibold text-marron-700 hover:underline">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}
