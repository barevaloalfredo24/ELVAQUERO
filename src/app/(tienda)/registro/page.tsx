// =====================================================================
// PÁGINA DE REGISTRO
// ---------------------------------------------------------------------
// Componente cliente. Crea una cuenta nueva (correo/contraseña) o con
// Google, y enlaza a iniciar sesión si ya tiene cuenta.
// =====================================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/contexto/auth";
import { BotonGoogle } from "@/components/tienda/BotonGoogle";
import { CampoContrasena } from "@/components/tienda/CampoContrasena";

export default function PaginaRegistro() {
  const { registrar, iniciarSesionGoogle } = useAuth();
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    // Validación local de coincidencia de contraseñas.
    if (password !== confirmacion) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    const resultado = await registrar({ nombre, email, password });
    if (resultado.ok) {
      router.push("/cuenta");
    } else {
      setError(resultado.mensaje ?? "No se pudo crear la cuenta.");
    }
  }

  // Registro/ingreso con Google.
  async function manejarGoogle(credential: string) {
    setCargando(true);
    setError("");
    const resultado = await iniciarSesionGoogle(credential);
    setCargando(false);
    if (resultado.ok) router.push("/cuenta");
    else setError(resultado.mensaje ?? "No se pudo iniciar sesión con Google.");
  }

  return (
    <div className="contenedor flex justify-center py-12">
      <div className="w-full max-w-md rounded-2xl border border-marron-100 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <span className="text-4xl">📝</span>
          <h1 className="mt-2 font-display text-2xl font-bold text-marron-900">Crear cuenta</h1>
          <p className="mt-1 text-sm text-marron-500">Únete a la familia El Vaquero</p>
        </div>

        <form onSubmit={enviar} className="space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-marron-700">Nombre completo</span>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              autoComplete="name"
              className="w-full rounded-lg border border-marron-200 px-3 py-2 outline-none focus:border-marron-500"
              placeholder="Tu nombre"
            />
          </label>
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
              minLength={6}
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-marron-700">Confirmar contraseña</span>
            <CampoContrasena
              value={confirmacion}
              onChange={setConfirmacion}
              required
              placeholder="Repite tu contraseña"
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
            Crear cuenta
          </button>
        </form>

        {/* Separador. */}
        <div className="my-4 flex items-center gap-3 text-xs text-marron-400">
          <span className="h-px flex-1 bg-marron-100" /> o <span className="h-px flex-1 bg-marron-100" />
        </div>

        <BotonGoogle onCredential={manejarGoogle} />

        {/* Redirige al panel de inicio de sesión. */}
        <div className="mt-6 text-center text-sm text-marron-500">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="font-semibold text-marron-700 hover:underline"
          >
            Inicia sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
