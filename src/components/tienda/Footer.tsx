// =====================================================================
// PIE DE PÁGINA DE LA TIENDA
// ---------------------------------------------------------------------
// Componente de servidor (no requiere interactividad). Muestra enlaces
// de ayuda, categorías e información de contacto, en columnas que se
// apilan en móvil y se distribuyen en escritorio.
// =====================================================================

import Link from "next/link";
import { categorias } from "@/lib/datos";

export function Footer() {
  return (
    <footer className="mt-12 bg-marron-950 text-marron-200">
      <div className="contenedor grid grid-cols-1 gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {/* Columna de marca. */}
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-marron-700 text-lg">
              🤠
            </span>
            <span className="font-display text-xl font-bold text-crema">El Vaquero</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-marron-300">
            Vestimenta y accesorios vaqueros de cuero genuino. Tradición del oeste con envíos a toda
            Guatemala.
          </p>
        </div>

        {/* Columna de categorías. */}
        <div>
          <h3 className="font-display text-lg font-semibold text-crema">Categorías</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {categorias.map((c) => (
              <li key={c.id}>
                <Link href={`/catalogo?categoria=${c.slug}`} className="hover:text-dorado">
                  {c.nombre}
                </Link>
              </li>
            ))}
          </ul>
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
            <li>📍 Ciudad de Guatemala</li>
            <li>📞 +502 5555 0000</li>
            <li>✉️ ventas@elvaquero.com</li>
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
