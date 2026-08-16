// =====================================================================
// BARRA DE ADMINISTRACIÓN (sidebar + encabezado)
// ---------------------------------------------------------------------
// Componente cliente que dibuja el "esqueleto" del panel admin: barra
// lateral de navegación (fija en escritorio, tipo cajón en móvil) y
// encabezado superior con botón de menú para pantallas pequeñas.
// =====================================================================

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

// Elementos del menú de administración.
const ENLACES = [
  { href: "/admin", etiqueta: "Dashboard", icono: "📊" },
  { href: "/admin/productos", etiqueta: "Productos", icono: "👢" },
  { href: "/admin/pedidos", etiqueta: "Pedidos", icono: "📦" },
  { href: "/admin/clientes", etiqueta: "Clientes", icono: "👥" },
  { href: "/admin/inventario", etiqueta: "Inventario", icono: "⚠️" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);

  // Marca como activo el enlace que coincide con la ruta actual.
  const esActivo = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <div className="flex min-h-screen">
      {/* ============ BARRA LATERAL ============ */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-marron-950 text-marron-200 transition-transform lg:translate-x-0 ${
          abierto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logotipo del panel. */}
          <div className="flex items-center gap-2 border-b border-marron-800 px-5 py-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-marron-700 text-lg">
              🤠
            </span>
            <div>
              <p className="font-display text-lg font-bold text-crema">El Vaquero</p>
              <p className="text-xs text-marron-400">Panel de administración</p>
            </div>
          </div>

          {/* Navegación. */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {ENLACES.map((e) => (
              <Link
                key={e.href}
                href={e.href}
                onClick={() => setAbierto(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  esActivo(e.href)
                    ? "bg-marron-800 text-white"
                    : "text-marron-300 hover:bg-marron-900 hover:text-white"
                }`}
              >
                <span>{e.icono}</span>
                {e.etiqueta}
              </Link>
            ))}
          </nav>

          {/* Enlace para volver a la tienda. */}
          <div className="border-t border-marron-800 px-3 py-4">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-marron-300 hover:bg-marron-900 hover:text-white"
            >
              <span>🏠</span> Ver tienda
            </Link>
          </div>
        </div>
      </aside>

      {/* Fondo oscuro al abrir el cajón en móvil. */}
      {abierto && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setAbierto(false)}
        />
      )}

      {/* ============ CONTENIDO PRINCIPAL ============ */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        {/* Encabezado superior. */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-marron-100 bg-crema/95 px-4 py-3 backdrop-blur">
          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            className="rounded-md p-1.5 text-marron-800 hover:bg-marron-100 lg:hidden"
            aria-label="Abrir menú"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="font-display text-lg font-bold text-marron-900">
            {ENLACES.find((e) => esActivo(e.href))?.etiqueta ?? "Panel"}
          </h1>
        </header>

        {/* Contenido de cada página del panel. */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
