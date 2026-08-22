// =====================================================================
// PÁGINA DE LISTA DE DESEOS
// ---------------------------------------------------------------------
// Muestra los productos guardados por el usuario autenticado.
// =====================================================================

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/contexto/auth";
import { obtenerDeseos } from "@/lib/servicios/deseos";
import { TarjetaProducto } from "@/components/tienda/TarjetaProducto";
import type { Producto } from "@/lib/tipos";

export default function PaginaDeseos() {
  const { autenticado, token, esStaff } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!token) return;
    let activo = true;
    obtenerDeseos(token).then((data) => {
      if (!activo) return;
      setProductos(data);
      setCargando(false);
    });
    return () => {
      activo = false;
    };
  }, [token]);

  if (!autenticado) {
    return (
      <div className="contenedor flex flex-col items-center gap-4 py-20 text-center">
        <span className="text-6xl">🔐</span>
        <h1 className="font-display text-2xl font-bold text-marron-900">Inicia sesión</h1>
        <p className="text-marron-500">Guarda tus productos favoritos iniciando sesión.</p>
        <Link
          href="/login?redirigir=/deseos"
          className="rounded-full bg-marron-700 px-6 py-3 font-semibold text-white"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  if (esStaff) {
    return (
      <div className="contenedor flex flex-col items-center gap-4 py-20 text-center">
        <span className="text-6xl">🚫</span>
        <h1 className="font-display text-2xl font-bold text-marron-900">
          No tienes acceso a la lista de deseos
        </h1>
        <p className="text-marron-500">Tu cuenta es de staff y solo gestiona productos.</p>
      </div>
    );
  }

  return (
    <div className="contenedor py-8">
      <h1 className="mb-6 font-display text-2xl font-bold text-marron-900 sm:text-3xl">
        ❤️ Mi lista de deseos
      </h1>

      {cargando ? (
        <p className="rounded-xl border border-dashed border-marron-200 bg-white py-12 text-center text-marron-500">
          Cargando…
        </p>
      ) : productos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-marron-200 bg-white py-12 text-center">
          <p className="text-marron-500">Aún no has guardado ningún producto.</p>
          <Link
            href="/catalogo"
            className="mt-3 inline-block rounded-full bg-marron-700 px-5 py-2 text-sm font-semibold text-white"
          >
            Explorar catálogo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {productos.map((p) => (
            <TarjetaProducto key={p.id} producto={p} />
          ))}
        </div>
      )}
    </div>
  );
}
