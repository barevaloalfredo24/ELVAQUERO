// =====================================================================
// PÁGINA DE INICIO
// ---------------------------------------------------------------------
// Componente de servidor (SSR/SSG): carga las categorías y los productos
// destacados desde la capa de servicios y los renderiza. Al ser servidor,
// el contenido es indexable por Google (SEO), tal como pide el proyecto.
// =====================================================================

import Link from "next/link";
import { obtenerCategorias, obtenerProductosDestacados } from "@/lib/servicios/catalogo";
import { TarjetaProducto } from "@/components/tienda/TarjetaProducto";

export default async function PaginaInicio() {
  // Carga de datos en paralelo desde la capa de servicios.
  const [categorias, destacados] = await Promise.all([
    obtenerCategorias(),
    obtenerProductosDestacados(),
  ]);

  return (
    <div>
      {/* ===================== HERO ===================== */}
      <section className="bg-gradient-to-br from-marron-900 via-marron-800 to-marron-700 text-crema">
        <div className="contenedor flex flex-col items-start gap-6 py-16 sm:py-20 lg:py-28">
          <span className="rounded-full bg-dorado px-4 py-1 text-xs font-semibold uppercase tracking-wide text-marron-950">
            Calidad de cuero genuino
          </span>
          <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            Viste con el espíritu
            <br />
            del <span className="text-dorado">viejo oeste</span>
          </h1>
          <p className="max-w-xl text-lg text-marron-100">
            Botas, sombreros, cinturones y accesorios vaqueros de fabricación artesanal. Envíos a
            toda Guatemala con pago contra entrega.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/catalogo"
              className="rounded-full bg-dorado px-6 py-3 font-semibold text-marron-950 transition hover:bg-dorado-oscuro"
            >
              Ver catálogo
            </Link>
            <Link
              href="/catalogo?oferta=1"
              className="rounded-full border border-marron-200 px-6 py-3 font-semibold text-crema transition hover:bg-marron-700"
            >
              Ver ofertas
            </Link>
          </div>
        </div>
      </section>

      {/* ===================== BENEFICIOS ===================== */}
      <section className="border-b border-marron-100 bg-white">
        <div className="contenedor grid grid-cols-2 gap-4 py-6 text-center sm:grid-cols-4">
          {[
            { icono: "🚚", titulo: "Envío a domicilio", texto: "Toda Guatemala" },
            { icono: "💵", titulo: "Pago contra entrega", texto: "Paga al recibir" },
            { icono: "🔒", titulo: "Compra segura", texto: "Pago con tarjeta" },
            { icono: "↩️", titulo: "Devoluciones", texto: "Garantía de 7 días" },
          ].map((b) => (
            <div key={b.titulo} className="flex flex-col items-center gap-1">
              <span className="text-2xl">{b.icono}</span>
              <span className="font-semibold text-marron-800">{b.titulo}</span>
              <span className="text-xs text-marron-500">{b.texto}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== CATEGORÍAS ===================== */}
      <section className="contenedor py-12">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-display text-2xl font-bold text-marron-900 sm:text-3xl">
            Compra por categoría
          </h2>
          <Link href="/catalogo" className="text-sm font-medium text-marron-600 hover:text-marron-800">
            Ver todo →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categorias.map((c) => (
            <Link
              key={c.id}
              href={`/catalogo?categoria=${c.slug}`}
              className="group flex flex-col items-center gap-2 rounded-xl border border-marron-100 bg-white p-5 text-center transition hover:-translate-y-1 hover:shadow-md"
            >
              <span className="text-4xl transition group-hover:scale-110">{c.icono}</span>
              <span className="font-medium text-marron-800">{c.nombre}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ===================== DESTACADOS ===================== */}
      <section className="bg-marron-50 py-12">
        <div className="contenedor">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="font-display text-2xl font-bold text-marron-900 sm:text-3xl">
              Productos destacados
            </h2>
            <Link href="/catalogo" className="text-sm font-medium text-marron-600 hover:text-marron-800">
              Ver catálogo completo →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {destacados.map((p) => (
              <TarjetaProducto key={p.id} producto={p} />
            ))}
          </div>
        </div>
      </section>

      {/* ===================== CTA FINAL ===================== */}
      <section className="contenedor py-12">
        <div className="rounded-2xl bg-marron-800 px-6 py-10 text-center text-crema sm:px-12">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            ¿No encuentras tu talla o modelo?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-marron-200">
            Escríbenos y te ayudamos a encontrar el producto ideal para ti. Fabricamos piezas sobre
            pedido.
          </p>
          <Link
            href="mailto:ventas@elvaquero.com"
            className="mt-6 inline-block rounded-full bg-dorado px-6 py-3 font-semibold text-marron-950 transition hover:bg-dorado-oscuro"
          >
            Contáctanos
          </Link>
        </div>
      </section>
    </div>
  );
}
