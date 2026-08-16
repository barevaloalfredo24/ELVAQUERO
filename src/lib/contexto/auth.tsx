// =====================================================================
// CONTEXTO DE AUTENTICACIÓN (SIMULADO)
// ---------------------------------------------------------------------
// Gestiona la sesión del usuario en el cliente. Es una implementación
// temporal: cuando exista backend se sustituirá por Auth0 / Firebase /
// NextAuth. La sesión se persiste en localStorage para no perderla al
// recargar.
// =====================================================================

"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { usuarios } from "@/lib/datos";
import { useAlmacenLocal } from "@/lib/hooks/use-almacen-local";
import type { Usuario } from "@/lib/tipos";

const CLAVE_STORAGE = "elvaquero-usuario";

// Resultado de una operación de autenticación (éxito o error con mensaje).
export interface ResultadoAuth {
  ok: boolean;
  mensaje?: string;
}

interface AuthContexto {
  usuario: Usuario | null;
  autenticado: boolean;
  esAdmin: boolean;
  iniciarSesion: (email: string, password: string) => Promise<ResultadoAuth>;
  registrar: (datos: { nombre: string; email: string; password: string }) => Promise<ResultadoAuth>;
  cerrarSesion: () => void;
}

const ContextoAuth = createContext<AuthContexto | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Sesión persistida en localStorage (null = sin sesión).
  const [usuario, setUsuario] = useAlmacenLocal<Usuario | null>(CLAVE_STORAGE, null);

  // Inicia sesión. En este mock no se valida la contraseña; si el correo
  // coincide con un usuario de prueba se usa ese, si no se crea uno nuevo.
  const iniciarSesion = useCallback(
    async (email: string): Promise<ResultadoAuth> => {
      const normalizado = email.trim().toLowerCase();
      if (!normalizado) return { ok: false, mensaje: "Ingresa tu correo electrónico." };

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
      return { ok: true };
    },
    [setUsuario],
  );

  // Registra un nuevo cliente (queda como NO verificado hasta confirmar correo).
  const registrar = useCallback(
    async (datos: { nombre: string; email: string; password: string }): Promise<ResultadoAuth> => {
      const email = datos.email.trim().toLowerCase();
      if (!datos.nombre.trim()) return { ok: false, mensaje: "Ingresa tu nombre." };
      if (!email) return { ok: false, mensaje: "Ingresa un correo válido." };
      if (!datos.password || datos.password.length < 6) {
        return { ok: false, mensaje: "La contraseña debe tener al menos 6 caracteres." };
      }
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
      return { ok: true };
    },
    [setUsuario],
  );

  const cerrarSesion = useCallback(() => setUsuario(null), [setUsuario]);

  const valor = useMemo(
    () => ({
      usuario,
      autenticado: usuario !== null,
      esAdmin: usuario?.rol === "admin",
      iniciarSesion,
      registrar,
      cerrarSesion,
    }),
    [usuario, iniciarSesion, registrar, cerrarSesion],
  );

  return <ContextoAuth.Provider value={valor}>{children}</ContextoAuth.Provider>;
}

// Hook para consumir la sesión desde cualquier componente cliente.
export function useAuth(): AuthContexto {
  const contexto = useContext(ContextoAuth);
  if (!contexto) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return contexto;
}
