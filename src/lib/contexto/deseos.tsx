// =====================================================================
// CONTEXTO DE LISTA DE DESEOS
// ---------------------------------------------------------------------
// Mantiene los ids de los productos guardados por el usuario autenticado
// para marcar los botones de corazón sin hacer una petición por botón.
// =====================================================================

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./auth";
import { agregarDeseo, obtenerDeseosIds, quitarDeseo } from "@/lib/servicios/deseos";

interface DeseosContexto {
  ids: string[];
  estaEnDeseos: (productoId: string) => boolean;
  alternar: (productoId: string) => Promise<void>;
}

const ContextoDeseos = createContext<DeseosContexto | null>(null);

export function DeseosProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [ids, setIds] = useState<string[]>([]);

  // Carga los ids de la wishlist cuando cambia el token (login/logout).
  useEffect(() => {
    if (!token) return;
    let activo = true;
    obtenerDeseosIds(token).then((data) => {
      if (activo) setIds(data);
    });
    return () => {
      activo = false;
    };
  }, [token]);

  const estaEnDeseos = useCallback((productoId: string) => ids.includes(productoId), [ids]);

  const alternar = useCallback(
    async (productoId: string) => {
      if (!token) return;
      const activo = ids.includes(productoId);
      if (activo) {
        const ok = await quitarDeseo(token, productoId);
        if (ok) setIds((prev) => prev.filter((id) => id !== productoId));
      } else {
        const ok = await agregarDeseo(token, productoId);
        if (ok) setIds((prev) => [...prev, productoId]);
      }
    },
    [token, ids],
  );

  const valor = useMemo(
    () => ({ ids, estaEnDeseos, alternar }),
    [ids, estaEnDeseos, alternar],
  );

  return <ContextoDeseos.Provider value={valor}>{children}</ContextoDeseos.Provider>;
}

export function useDeseos(): DeseosContexto {
  const contexto = useContext(ContextoDeseos);
  if (!contexto) throw new Error("useDeseos debe usarse dentro de <DeseosProvider>");
  return contexto;
}
