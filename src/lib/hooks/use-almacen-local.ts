// =====================================================================
// HOOK: useAlmacenLocal
// ---------------------------------------------------------------------
// Expone un valor persistido en localStorage como estado de React usando
// `useSyncExternalStore`. Este es el patrón recomendado para leer datos
// "solo-cliente" (como localStorage) SIN disparar errores de hidratación
// ni llamar a setState dentro de effects.
// =====================================================================

"use client";

import { useCallback, useSyncExternalStore } from "react";

// Almacén en memoria que espeja cada clave de localStorage.
const estados = new Map<string, unknown>();
// Oyentes suscritos por clave, para notificar cambios.
const oyentes = new Map<string, Set<() => void>>();

// Lee un valor de localStorage; si no existe o hay error, devuelve el inicial.
function leer<T>(clave: string, inicial: T): T {
  if (typeof window === "undefined") return inicial;
  try {
    const guardado = localStorage.getItem(clave);
    return guardado ? (JSON.parse(guardado) as T) : inicial;
  } catch {
    return inicial;
  }
}

// Notifica a todos los suscriptores de una clave.
function notificar(clave: string) {
  oyentes.get(clave)?.forEach((fn) => fn());
}

export function useAlmacenLocal<T>(clave: string, inicial: T) {
  // Suscripción: registra/elimina el oyente en el conjunto de la clave.
  const suscribir = useCallback(
    (fn: () => void) => {
      if (!oyentes.has(clave)) oyentes.set(clave, new Set());
      oyentes.get(clave)!.add(fn);
      return () => oyentes.get(clave)?.delete(fn);
    },
    [clave],
  );

  // Snapshot del servidor: siempre el valor inicial (determinista).
  const getServerSnapshot = useCallback(() => inicial, [inicial]);

  // Snapshot del cliente: devuelve el valor en memoria (cargándolo la 1ª vez).
  const getSnapshot = useCallback(() => {
    if (!estados.has(clave)) {
      estados.set(clave, leer(clave, inicial));
    }
    return estados.get(clave) as T;
  }, [clave, inicial]);

  const valor = useSyncExternalStore(suscribir, getSnapshot, getServerSnapshot);

  // Setter que acepta un valor directo o una función actualizadora.
  const establecer = useCallback(
    (actualizador: T | ((previo: T) => T)) => {
      const previo = (estados.get(clave) ?? leer(clave, inicial)) as T;
      const siguiente =
        typeof actualizador === "function"
          ? (actualizador as (p: T) => T)(previo)
          : actualizador;
      estados.set(clave, siguiente);
      if (typeof window !== "undefined") {
        localStorage.setItem(clave, JSON.stringify(siguiente));
      }
      notificar(clave);
    },
    [clave, inicial],
  );

  return [valor, establecer] as const;
}
