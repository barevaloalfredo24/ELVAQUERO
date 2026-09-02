// =====================================================================
// CONTEXTO DE CARRITO DE COMPRAS
// ---------------------------------------------------------------------
// Gestiona el estado global del carrito en el cliente y lo persiste en
// localStorage mediante el hook `useAlmacenLocal`. Así el carrito
// "temporal" del usuario no se pierde al recargar (mecanismo recomendado
// para usuarios NO autenticados mientras no exista backend).
// =====================================================================

"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { useAlmacenLocal } from "@/lib/hooks/use-almacen-local";

// Clave usada para guardar el carrito en localStorage.
const CLAVE_STORAGE = "elvaquero-carrito";

// Valor inicial estable (referencia constante) para evitar re-renders.
const CARRITO_VACIO: LineaCarrito[] = [];

// Línea de carrito ya "resuelta": incluye la información mínima
// necesaria para pintarla sin volver a consultar el producto completo.
export interface LineaCarrito {
  productoId: string;
  varianteId: string;
  nombre: string;
  talla: string;
  color: string;
  precioUnitario: number;
  cantidad: number;
  imagen?: string; // URL de la foto principal del producto
}

interface CarritoContexto {
  lineas: LineaCarrito[];
  cantidadTotal: number; // Número total de unidades
  subtotal: number; // Suma de los precios (sin envío)
  agregar: (linea: Omit<LineaCarrito, "cantidad">, cantidad?: number) => void;
  actualizarCantidad: (productoId: string, varianteId: string, cantidad: number) => void;
  eliminar: (productoId: string, varianteId: string) => void;
  vaciar: () => void;
}

const ContextoCarrito = createContext<CarritoContexto | null>(null);

// Clave única de una línea: producto + variante.
const claveLinea = (productoId: string, varianteId: string) => `${productoId}::${varianteId}`;

export function CarritoProvider({ children }: { children: React.ReactNode }) {
  // Estado persistente en localStorage (snapshot estable vía useSyncExternalStore).
  const [lineas, setLineas] = useAlmacenLocal<LineaCarrito[]>(CLAVE_STORAGE, CARRITO_VACIO);

  // Agrega un producto al carrito (o suma cantidad si ya existe).
  const agregar = useCallback(
    (linea: Omit<LineaCarrito, "cantidad">, cantidad = 1) => {
      setLineas((previas) => {
        const clave = claveLinea(linea.productoId, linea.varianteId);
        const existe = previas.some((l) => claveLinea(l.productoId, l.varianteId) === clave);
        if (existe) {
          return previas.map((l) =>
            claveLinea(l.productoId, l.varianteId) === clave
              ? { ...l, cantidad: l.cantidad + cantidad }
              : l,
          );
        }
        return [...previas, { ...linea, cantidad }];
      });
    },
    [setLineas],
  );

  // Actualiza la cantidad de una línea; si llega a 0, se elimina.
  const actualizarCantidad = useCallback(
    (productoId: string, varianteId: string, cantidad: number) => {
      setLineas((previas) =>
        previas
          .map((l) =>
            claveLinea(l.productoId, l.varianteId) === claveLinea(productoId, varianteId)
              ? { ...l, cantidad }
              : l,
          )
          .filter((l) => l.cantidad > 0),
      );
    },
    [setLineas],
  );

  // Elimina una línea concreta del carrito.
  const eliminar = useCallback(
    (productoId: string, varianteId: string) => {
      setLineas((previas) =>
        previas.filter(
          (l) => claveLinea(l.productoId, l.varianteId) !== claveLinea(productoId, varianteId),
        ),
      );
    },
    [setLineas],
  );

  // Vacía el carrito por completo.
  const vaciar = useCallback(() => setLineas(CARRITO_VACIO), [setLineas]);

  // Valores derivados (memoizados para no recalcular en cada render).
  const cantidadTotal = useMemo(() => lineas.reduce((acc, l) => acc + l.cantidad, 0), [lineas]);
  const subtotal = useMemo(
    () => lineas.reduce((acc, l) => acc + l.precioUnitario * l.cantidad, 0),
    [lineas],
  );

  const valor = useMemo(
    () => ({ lineas, cantidadTotal, subtotal, agregar, actualizarCantidad, eliminar, vaciar }),
    [lineas, cantidadTotal, subtotal, agregar, actualizarCantidad, eliminar, vaciar],
  );

  return <ContextoCarrito.Provider value={valor}>{children}</ContextoCarrito.Provider>;
}

// Hook para consumir el carrito desde cualquier componente cliente.
export function useCarrito(): CarritoContexto {
  const contexto = useContext(ContextoCarrito);
  if (!contexto) throw new Error("useCarrito debe usarse dentro de <CarritoProvider>");
  return contexto;
}
