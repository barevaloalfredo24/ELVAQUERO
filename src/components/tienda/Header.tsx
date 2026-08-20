// =====================================================================
// ENCABEZADO DE LA TIENDA
// ---------------------------------------------------------------------
// Componente cliente: necesita estado local para el menú móvil y lee
// el carrito y la sesión desde los contextos globales. Es totalmente
// responsivo (menú hamburguesa en móvil, barra de búsqueda en pantallas
// medianas/grandes y navegación horizontal en escritorio).
// =====================================================================

"use client";

import Link from "next/link";
import { useState } from "react";
import { categorias } from "@/lib/datos";
import { emojiCategoria } from "@/lib/emoji";
import { useCarrito } from "@/lib/contexto/carrito";
import { useAuth } from "@/lib/contexto/auth";
import { BuscadorProductos } from "./BuscadorProductos";

// Pequeños iconos SVG en línea (evitan una dependencia externa).
function IconoCarrito() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3h2l2.4 12.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 7H6" />
      <circle cx="9" cy="20" r="1" fill="currentColor" />
      <circle cx="17" cy="20" r="1" fill="currentColor" />
    </svg>
  );
}

function IconoUsuario() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
    </svg>
  );
}

function IconoMenu() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function IconoCerrar() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function Header() {
  const { cantidadTotal } = useCarrito();
  const { usuario, autenticado, esAdmin, esStaff, cerrarSesion } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [categoriasAbiertas, setCategoriasAbiertas] = useState(false);

  // Enlaces principales de la navegación de escritorio.
  const enlaces = [
    { href: "/", etiqueta: "Inicio" },
    { href: "/catalogo", etiqueta: "Catálogo" },
  ];

  // Cierra el menú móvil cuando se navega.
  function navegarYCerrar() {
    setMenuAbierto(false);
    setCategoriasAbiertas(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-marron-100 bg-crema/95 backdrop-blur">
      {/* Franja superior de promoción. */}
      <div className="bg-marron-900 py-1.5 text-center text-xs font-medium text-crema">
        🐎 Envío gratis en pedidos mayores a Q500
      </div>

      {/* Fila principal: logo, búsqueda y acciones. */}
      <div className="contenedor flex items-center justify-between gap-4 py-3">
        {/* Botón menú (solo móvil). */}
        <button
          type="button"
          className="rounded-md p-1 text-marron-800 hover:bg-marron-100 md:hidden"
          onClick={() => setMenuAbierto((v) => !v)}
          aria-label="Abrir menú"
        >
          {menuAbierto ? <IconoCerrar /> : <IconoMenu />}
        </button>

        {/* Logotipo de la marca. */}
        <Link href="/" className="flex items-center gap-2" onClick={navegarYCerrar}>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-marron-700 text-lg text-crema">
            🤠
          </span>
          <span className="font-display text-xl font-bold tracking-tight text-marron-900 sm:text-2xl">
            El Vaquero
          </span>
        </Link>

        {/* Barra de búsqueda con autocompletado (oculta en móvil). */}
        <div className="hidden flex-1 justify-center md:flex">
          <BuscadorProductos
            placeholder="Buscar botas, sombreros, cinturones…"
            className="w-full max-w-md"
          />
        </div>

        {/* Acciones: cuenta y carrito. */}
        <div className="flex items-center gap-1">
          {/* Enlace a cuenta / panel según sesión. */}
          {autenticado ? (
            <div className="relative">
              <Link
                href={esAdmin || esStaff ? "/admin" : "/cuenta"}
                className="flex items-center gap-1 rounded-md p-1.5 text-marron-800 hover:bg-marron-100"
                title={esAdmin || esStaff ? "Panel de administración" : "Mi cuenta"}
              >
                <IconoUsuario />
                <span className="hidden max-w-[8rem] truncate text-sm lg:inline">
                  {usuario?.nombre}
                </span>
              </Link>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1 rounded-md p-1.5 text-marron-800 hover:bg-marron-100"
              title="Iniciar sesión"
            >
              <IconoUsuario />
              <span className="hidden text-sm lg:inline">Ingresar</span>
            </Link>
          )}

          {/* Enlace al carrito con contador. */}
          <Link
            href="/carrito"
            className="relative flex items-center gap-1 rounded-md p-1.5 text-marron-800 hover:bg-marron-100"
            title="Carrito"
          >
            <IconoCarrito />
            {cantidadTotal > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-dorado px-1 text-xs font-bold text-white">
                {cantidadTotal}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Navegación de escritorio. */}
      <nav className="hidden border-t border-marron-100 md:block">
        <div className="contenedor flex items-center gap-1">
          {enlaces.map((e) => (
            <Link
              key={e.etiqueta}
              href={e.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-marron-800 hover:bg-marron-100"
            >
              {e.etiqueta}
            </Link>
          ))}

          {/* Desplegable de categorías. */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setCategoriasAbiertas((v) => !v)}
              className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-marron-800 hover:bg-marron-100"
            >
              Categorías
              <span className="text-xs">▾</span>
            </button>
            {categoriasAbiertas && (
              <div className="absolute left-0 top-full z-10 w-56 rounded-lg border border-marron-100 bg-white py-2 shadow-lg">
                {categorias.map((c) => (
                  <Link
                    key={c.id}
                    href={`/catalogo?categoria=${c.slug}`}
                    onClick={() => setCategoriasAbiertas(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-marron-800 hover:bg-marron-50"
                  >
                    <span>{emojiCategoria(c.slug)}</span>
                    {c.nombre}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Menú móvil desplegable. */}
      {menuAbierto && (
        <div className="border-t border-marron-100 bg-crema md:hidden">
          <div className="contenedor flex flex-col gap-1 py-3">
            {/* Búsqueda en móvil. */}
            <div className="mb-2">
              <BuscadorProductos placeholder="Buscar productos…" />
            </div>

            {enlaces.map((e) => (
              <Link
                key={e.etiqueta}
                href={e.href}
                onClick={navegarYCerrar}
                className="rounded-md px-3 py-2.5 text-base font-medium text-marron-800 hover:bg-marron-100"
              >
                {e.etiqueta}
              </Link>
            ))}

            {/* Categorías en móvil. */}
            <p className="mt-2 px-3 text-xs font-semibold uppercase tracking-wide text-marron-500">
              Categorías
            </p>
            {categorias.map((c) => (
              <Link
                key={c.id}
                href={`/catalogo?categoria=${c.slug}`}
                onClick={navegarYCerrar}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-marron-800 hover:bg-marron-100"
              >
                <span>{emojiCategoria(c.slug)}</span>
                {c.nombre}
              </Link>
            ))}

            {/* Sesión en móvil. */}
            <div className="mt-2 border-t border-marron-100 pt-2">
              {autenticado ? (
                <button
                  type="button"
                  onClick={() => { cerrarSesion(); navegarYCerrar(); }}
                  className="w-full rounded-md px-3 py-2.5 text-left text-sm font-medium text-marron-700 hover:bg-marron-100"
                >
                  Cerrar sesión ({usuario?.nombre})
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={navegarYCerrar}
                  className="block rounded-md px-3 py-2.5 text-sm font-medium text-marron-800 hover:bg-marron-100"
                >
                  Iniciar sesión / Registrarse
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
