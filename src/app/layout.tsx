// =====================================================================
// LAYOUT RAÍZ DE LA APLICACIÓN
// ---------------------------------------------------------------------
// Define el <html> y <body> globales, las fuentes, los metadatos de SEO
// y envuelve todo con los proveedores globales (carrito y auth).
// =====================================================================

import type { Metadata } from "next";
import { Geist, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Proveedores } from "@/components/proveedores";

// Fuente sans para el cuerpo del sitio.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Fuente serif para títulos con aire del viejo oeste.
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

// Metadatos base del sitio (SEO).
export const metadata: Metadata = {
  title: {
    default: "El Vaquero | Vestimenta y accesorios vaqueros",
    template: "%s | El Vaquero",
  },
  description:
    "Tienda en línea de botas, sombreros, cinturones y accesorios vaqueros. Calidad de cuero y envíos a toda Guatemala.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${geistSans.variable} ${playfair.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-crema font-sans text-marron-900">
        {/* Proveedores globales envuelven todas las páginas. */}
        <Proveedores>{children}</Proveedores>
      </body>
    </html>
  );
}
