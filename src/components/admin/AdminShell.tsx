// =====================================================================
// BARRA DE ADMINISTRACIÓN (sidebar + encabezado)
// ---------------------------------------------------------------------
// Componente cliente que dibuja el "esqueleto" del panel admin: barra
// lateral de navegación (fija en escritorio, tipo cajón en móvil) y
// encabezado superior. El menú se filtra según el rol del usuario:
//   - admin: acceso total
//   - staff: solo Productos, Pedidos, Clientes e Inventario
// =====================================================================

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/contexto/auth";

// Elementos del menú de administración con los roles que pueden verlos.
const ENLACES = [
  { href: "/admin", etiqueta: "Dashboard", icono: "📊", roles: ["admin"] },
  { href: "/admin/reportes", etiqueta: "Reportes", icono: "📈", roles: ["admin"] },
  { href: "/admin/productos", etiqueta: "Productos", icono: "👢", roles: ["admin", "staff"] },
  { href: "/admin/categorias", etiqueta: "Categorías", icono: "🏷️", roles: ["admin"] },
  { href: "/admin/cupones", etiqueta: "Cupones", icono: "🎟️", roles: ["admin"] },
  { href: "/admin/pedidos", etiqueta: "Pedidos", icono: "📦", roles: ["admin", "staff"] },
  { href: "/admin/clientes", etiqueta: "Clientes", icono: "👥", roles: ["admin", "staff"] },
  { href: "/admin/staff", etiqueta: "Staff", icono: "🧑‍💼", roles: ["admin"] },
  { href: "/admin/inventario", etiqueta: "Inventario", icono: "⚠️", roles: ["admin", "staff"] },
];

// Rutas permitidas para el rol staff.
const RUTAS_STAFF = [
  "/admin/productos",
  "/admin/pedidos",
  "/admin/clientes",
  "/admin/inventario",
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { usuario, cerrarSesion } = useAuth();
  const [abierto, setAbierto] = useState(false);

  const rol = usuario?.rol ?? "";
  const esStaff = rol === "staff";

  // Enlaces visibles según el rol.
  const enlacesVisibles = ENLACES.filter((e) => e.roles.includes(rol));

  // Marca como activo el enlace que coincide con la ruta actual.
  const esActivo = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  // El staff no puede acceder a rutas fuera de sus permisos.
  const accesoDenegado = esStaff && !RUTAS_STAFF.some((r) => pathname.startsWith(r));

  // Cierra la sesión y vuelve a la tienda.
  function salir() {
    cerrarSesion();
    router.push("/");
  }

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

          {/* Navegación (filtrada por rol). */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {enlacesVisibles.map((e) => (
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

          {/* Enlace para volver a la tienda y cerrar sesión. */}
          <div className="border-t border-marron-800 px-3 py-4">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-marron-300 hover:bg-marron-900 hover:text-white"
            >
              <span>🏠</span> Ver tienda
            </Link>
            {usuario && (
              <button
                type="button"
                onClick={salir}
                className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-marron-300 hover:bg-marron-900 hover:text-white"
              >
                <span>🚪</span> Cerrar sesión
              </button>
            )}
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
            {enlacesVisibles.find((e) => esActivo(e.href))?.etiqueta ?? "Panel"}
          </h1>
          {/* Usuario conectado. */}
          {usuario && (
            <div className="ml-auto flex items-center gap-2 text-sm text-marron-600">
              <span className="hidden sm:inline">{usuario.nombre}</span>
              <span className="rounded-full bg-marron-100 px-2.5 py-1 text-xs font-medium uppercase text-marron-700">
                {usuario.rol}
              </span>
            </div>
          )}
        </header>

        {/* Contenido de cada página del panel (o mensaje de sin permiso). */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {accesoDenegado ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-marron-100 bg-white py-16 text-center">
              <span className="text-5xl">🚫</span>
              <p className="text-lg font-medium text-marron-800">No tienes acceso a esta sección.</p>
              <p className="text-sm text-marron-500">
                Tu rol de staff solo permite Productos, Pedidos, Clientes e Inventario.
              </p>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
