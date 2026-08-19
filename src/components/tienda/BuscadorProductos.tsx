// =====================================================================
// BUSCADOR DE PRODUCTOS (autocompletado)
// ---------------------------------------------------------------------
// Input de búsqueda con sugerencias en vivo. Usa el endpoint difuso del
// backend (/api/catalogo/buscar) para tolerar errores ortográficos y
// mostrar resultados a medida que el usuario escribe.
// =====================================================================

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { peticion } from "@/lib/api";
import { formatearPrecio } from "@/lib/util";
import type { Producto } from "@/lib/tipos";

export function BuscadorProductos({
  placeholder = "Buscar productos…",
  className = "",
}: {
  placeholder?: string;
  className?: string;
}) {
  const router = useRouter();
  const [termino, setTermino] = useState("");
  const [resultados, setResultados] = useState<Producto[]>([]);
  const [abierto, setAbierto] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce: busca 250ms después de la última tecla.
  function alCambiar(valor: string) {
    setTermino(valor);
    if (temporizador.current) clearTimeout(temporizador.current);

    if (!valor.trim()) {
      setResultados([]);
      setAbierto(false);
      return;
    }

    temporizador.current = setTimeout(async () => {
      const datos = await peticion<Producto[]>(
        `/api/catalogo/buscar?q=${encodeURIComponent(valor.trim())}`,
      );
      setResultados(datos ?? []);
      setAbierto(true);
    }, 250);
  }

  // Al enviar el formulario, navega al catálogo con la búsqueda.
  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAbierto(false);
    if (termino.trim()) {
      router.push(`/catalogo?busqueda=${encodeURIComponent(termino.trim())}`);
    }
  }

  return (
    <form onSubmit={enviar} className={`relative ${className}`}>
      <input
        type="search"
        value={termino}
        onChange={(e) => alCambiar(e.target.value)}
        onFocus={() => {
          if (resultados.length > 0) setAbierto(true);
        }}
        onBlur={() => setTimeout(() => setAbierto(false), 150)}
        placeholder={placeholder}
        className="w-full rounded-full border border-marron-200 bg-white py-2 pl-4 pr-10 text-sm outline-none focus:border-marron-500"
      />
      <button
        type="submit"
        aria-label="Buscar"
        className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-marron-600 hover:bg-marron-100"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
      </button>

      {/* Lista de sugerencias. */}
      {abierto && resultados.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-auto rounded-xl border border-marron-100 bg-white py-1 shadow-lg">
          {resultados.map((p) => (
            <li key={p.id}>
              <Link
                href={`/producto/${p.id}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setAbierto(false)}
                className="flex items-center justify-between gap-3 px-4 py-2 text-sm hover:bg-marron-50"
              >
                <span className="truncate font-medium text-marron-800">{p.nombre}</span>
                <span className="shrink-0 text-marron-500">{formatearPrecio(p.precio)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
