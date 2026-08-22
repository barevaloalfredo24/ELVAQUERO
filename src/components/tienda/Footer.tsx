// =====================================================================
// PIE DE PÁGINA DE LA TIENDA
// ---------------------------------------------------------------------
// Componente de servidor. Muestra enlaces de ayuda, el enlace al menú de
// categorías e información de contacto, en columnas que se apilan en
// móvil y se distribuyen en escritorio.
// =====================================================================

import Link from "next/link";
import { IconoSombrero } from "@/components/IconoSombrero";

// Iconos SVG en línea (aspecto profesional).
function IconoUbicacion() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function IconoTelefono() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L14 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 2 6a2 2 0 0 1 2-2z" />
    </svg>
  );
}

function IconoCorreo() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="mt-12 bg-marron-950 text-marron-200">
      <div className="contenedor grid grid-cols-1 gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {/* Columna de marca. */}
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-marron-700 text-crema">
              <IconoSombrero className="h-6 w-6" />
            </span>
            <span className="font-display text-xl font-bold text-crema">Curiosidades El Vaquero</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-marron-300">
            Vestimenta y accesorios vaqueros de cuero genuino. Tradición del oeste con envíos a toda
            Guatemala.
          </p>
        </div>

        {/* Columna de categorías (enlace al menú de categorías). */}
        <div>
          <h3 className="font-display text-lg font-semibold text-crema">
            <Link href="/catalogo" className="transition hover:text-dorado">
              Categorías
            </Link>
          </h3>
          <p className="mt-3 text-sm text-marron-300">
            <Link href="/catalogo" className="transition hover:text-dorado">
              Ver todas las categorías →
            </Link>
          </p>
        </div>

        {/* Columna de ayuda. */}
        <div>
          <h3 className="font-display text-lg font-semibold text-crema">Ayuda</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/catalogo" className="hover:text-dorado">Catálogo</Link></li>
            <li><Link href="/carrito" className="hover:text-dorado">Mi carrito</Link></li>
            <li><Link href="/cuenta" className="hover:text-dorado">Mi cuenta</Link></li>
            <li><Link href="/login" className="hover:text-dorado">Iniciar sesión</Link></li>
          </ul>
        </div>

        {/* Columna de contacto. */}
        <div>
          <h3 className="font-display text-lg font-semibold text-crema">Contacto</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-dorado"><IconoUbicacion /></span>
              <span>Calle principal, Barrio Santiago, Cubulco, Baja Verapaz, Guatemala, C.A</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="shrink-0 text-dorado"><IconoTelefono /></span>
              <span>5860-8456</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="shrink-0 text-dorado"><IconoCorreo /></span>
              <span>ventas@elvaquero.com</span>
            </li>
            <li className="pt-2 text-marron-400">
              Aceptamos pago con tarjeta y pago contra entrega.
            </li>
          </ul>
        </div>
      </div>

      {/* Franja inferior de derechos. */}
      <div className="border-t border-marron-800 py-4 text-center text-xs text-marron-400">
        © {new Date().getFullYear()} El Vaquero. Todos los derechos reservados.
      </div>
    </footer>
  );
}
