// =====================================================================
// PÁGINA DE REGISTRO
// ---------------------------------------------------------------------
// Componente cliente. Crea una cuenta nueva (mock) y deja al usuario
// en estado "no verificado" hasta confirmar su correo, tal como indica
// el flujo de negocio del proyecto.
// =====================================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/contexto/auth";

export default function PaginaRegistro() {
  const { registrar } = useAuth();
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [error, setError] = useState("");

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
              className="w-full rounded-lg border border-marron-200 px-3 py-2 outline-none focus:border-marron-500"
              placeholder="tucorreo@ejemplo.com"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-marron-700">Contraseña</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg border border-marron-200 px-3 py-2 outline-none focus:border-marron-500"
              placeholder="Mínimo 6 caracteres"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-marron-700">Confirmar contraseña</span>
            <input
              type="password"
              value={confirmacion}
              onChange={(e) => setConfirmacion(e.target.value)}
              required
              className="w-full rounded-lg border border-marron-200 px-3 py-2 outline-none focus:border-marron-500"
              placeholder="Repite tu contraseña"
            />
          </label>

          {error && (
            <p className="rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700">{error}</p>
          )}

          <button
            type="submit"
            className="w-full rounded-full bg-marron-700 py-3 font-semibold text-white transition hover:bg-marron-800"
          >
            Crear cuenta
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-marron-500">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-semibold text-marron-700 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
