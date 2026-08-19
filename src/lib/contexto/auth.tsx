// =====================================================================
// CONTEXTO DE AUTENTICACIÓN
// ---------------------------------------------------------------------
// Conecta con la API NestJS (registro/login con JWT). Si la API no está
// disponible, usa un respaldo local (mock) para no bloquear la demo.
// La sesión y el token se persisten en localStorage.
// =====================================================================

"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { usuarios } from "@/lib/datos";
import { useAlmacenLocal } from "@/lib/hooks/use-almacen-local";
import { API_URL } from "@/lib/api";
import type { Usuario } from "@/lib/tipos";

const CLAVE_USUARIO = "elvaquero-usuario";
const CLAVE_TOKEN = "elvaquero-token";

// Resultado de una operación de autenticación (éxito o error con mensaje).
export interface ResultadoAuth {
  ok: boolean;
  mensaje?: string;
}

interface AuthContexto {
  usuario: Usuario | null;
  token: string | null;
  autenticado: boolean;
  esAdmin: boolean;
  iniciarSesion: (email: string, password: string) => Promise<ResultadoAuth>;
  registrar: (datos: { nombre: string; email: string; password: string }) => Promise<ResultadoAuth>;
  cerrarSesion: () => void;
}

const ContextoAuth = createContext<AuthContexto | null>(null);

// Llama a un endpoint de auth y devuelve { ok, data, status }.
async function llamarAuth(
  ruta: string,
  body: Record<string, string>,
): Promise<{ ok: boolean; data?: { token: string; usuario: Usuario }; status: number }> {
  if (!API_URL) return { ok: false, status: 0 };
  try {
    const res = await fetch(`${API_URL}${ruta}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    return { ok: res.ok, data, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Sesión y token persistidos en localStorage.
  const [usuario, setUsuario] = useAlmacenLocal<Usuario | null>(CLAVE_USUARIO, null);
  const [token, setToken] = useAlmacenLocal<string | null>(CLAVE_TOKEN, null);

  // Inicia sesión (API primero, mock como respaldo).
  const iniciarSesion = useCallback(
    async (email: string, password: string): Promise<ResultadoAuth> => {
      const normalizado = email.trim().toLowerCase();
      if (!normalizado) return { ok: false, mensaje: "Ingresa tu correo electrónico." };

      const resultado = await llamarAuth("/api/auth/login", { email: normalizado, password });
      if (resultado.ok && resultado.data) {
        setUsuario(resultado.data.usuario);
        setToken(resultado.data.token);
        return { ok: true };
      }
      // Si el backend respondió con credenciales inválidas.
      if (resultado.status === 401) {
        return { ok: false, mensaje: "Credenciales inválidas." };
      }

      // --- Respaldo mock (sin backend disponible) ---
      const existente = usuarios.find((u) => u.email.toLowerCase() === normalizado);
      const sesion: Usuario = existente ?? {
        id: `u-${Date.now()}`,
        nombre: normalizado.split("@")[0],
        email: normalizado,
        rol: "cliente",
        verificado: true,
        metodoRegistro: "correo",
        fechaRegistro: new Date().toISOString(),
      };
      setUsuario(sesion);
      setToken(null);
      return { ok: true };
    },
    [setUsuario, setToken],
  );

  // Registra un cliente (API primero, mock como respaldo).
  const registrar = useCallback(
    async (datos: { nombre: string; email: string; password: string }): Promise<ResultadoAuth> => {
      const email = datos.email.trim().toLowerCase();
      if (!datos.nombre.trim()) return { ok: false, mensaje: "Ingresa tu nombre." };
      if (!email) return { ok: false, mensaje: "Ingresa un correo válido." };
      if (!datos.password || datos.password.length < 6) {
        return { ok: false, mensaje: "La contraseña debe tener al menos 6 caracteres." };
      }

      const resultado = await llamarAuth("/api/auth/registro", {
        nombre: datos.nombre,
        email,
        password: datos.password,
      });
      if (resultado.ok && resultado.data) {
        setUsuario(resultado.data.usuario);
        setToken(resultado.data.token);
        return { ok: true };
      }
      if (resultado.status === 409) {
        return { ok: false, mensaje: "Ya existe una cuenta con ese correo." };
      }

      // --- Respaldo mock ---
      if (usuarios.some((u) => u.email.toLowerCase() === email)) {
        return { ok: false, mensaje: "Ya existe una cuenta con ese correo." };
      }
      const nuevo: Usuario = {
        id: `u-${Date.now()}`,
        nombre: datos.nombre.trim(),
        email,
        rol: "cliente",
        verificado: false,
        metodoRegistro: "correo",
        fechaRegistro: new Date().toISOString(),
      };
      setUsuario(nuevo);
      setToken(null);
      return { ok: true };
    },
    [setUsuario, setToken],
  );

  const cerrarSesion = useCallback(() => {
    setUsuario(null);
    setToken(null);
  }, [setUsuario, setToken]);

  const valor = useMemo(
    () => ({
      usuario,
      token,
      autenticado: usuario !== null,
      esAdmin: usuario?.rol === "admin",
      iniciarSesion,
      registrar,
      cerrarSesion,
    }),
    [usuario, token, iniciarSesion, registrar, cerrarSesion],
  );

  return <ContextoAuth.Provider value={valor}>{children}</ContextoAuth.Provider>;
}

// Hook para consumir la sesión desde cualquier componente cliente.
export function useAuth(): AuthContexto {
  const contexto = useContext(ContextoAuth);
  if (!contexto) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return contexto;
}
