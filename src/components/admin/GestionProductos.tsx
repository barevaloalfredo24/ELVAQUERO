// =====================================================================
// GESTIÓN DE PRODUCTOS (cliente)
// ---------------------------------------------------------------------
// CRUD de productos para administradores y staff. Incluye formulario de
// creación/edición con variantes (talla, color, stock, precio). Las
// mutaciones van autenticadas con el token JWT.
// =====================================================================

"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useAuth } from "@/lib/contexto/auth";
import { API_URL, peticion, peticionAuth } from "@/lib/api";
import { formatearPrecio } from "@/lib/util";
import { filtrarPorBusqueda } from "@/lib/busqueda";
import { comprimirImagen } from "@/lib/imagen";
import type { Categoria, Imagen, Producto } from "@/lib/tipos";

// Fila de variante en el formulario.
interface FilaVariante {
  talla: string;
  color: string;
  stock: string;
  precio: string;
}

export function GestionProductos({
  productosInicial,
  categorias,
}: {
  productosInicial: Producto[];
  categorias: Categoria[];
}) {
  const { token, usuario, autenticado } = useAuth();
  const puedeGestionar = autenticado && (usuario?.rol === "admin" || usuario?.rol === "staff");

  const [lista, setLista] = useState<Producto[]>(productosInicial);
  const [formAbierto, setFormAbierto] = useState(false);
  const [editando, setEditando] = useState<Producto | null>(null);
  const [nombre, setNombre] = useState("");
  const [slug, setSlug] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [precioBase, setPrecioBase] = useState("");
  const [umbralStockBajo, setUmbralStockBajo] = useState("5");
  const [variantes, setVariantes] = useState<FilaVariante[]>([]);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [imagenesNuevas, setImagenesNuevas] = useState<File[]>([]);
  const [previewsNuevas, setPreviewsNuevas] = useState<string[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const archivoRef = useRef<HTMLInputElement>(null);

  // Si no es admin ni staff, no se muestra la gestión.
  if (!puedeGestionar) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-marron-100 bg-white py-16 text-center">
        <span className="text-5xl">🔐</span>
        <p className="text-lg font-medium text-marron-800">
          Inicia sesión como administrador o staff para gestionar productos.
        </p>
      </div>
    );
  }

  // Recarga los productos desde la API (y actualiza el producto en edición).
  async function recargar() {
    const datos = await peticion<Producto[]>("/api/admin/productos");
    if (datos) {
      setLista(datos);
      setEditando((actual) => {
        if (!actual) return actual;
        const actualizado = datos.find((p) => p.id === actual.id);
        return actualizado ?? actual;
      });
    }
  }

  // Sube una imagen a un producto (se usa al crear y al editar).
  async function subirImagenAProducto(productoId: string, archivo: File) {
    setSubiendo(true);
    setError("");
    try {
      // Comprime/redimensiona a 4:3 (1200x900) antes de subir.
      const comprimida = await comprimirImagen(archivo);
      const formData = new FormData();
      formData.append("imagen", comprimida, "producto.jpg");

      const res = await fetch(`${API_URL}/api/admin/productos/${productoId}/imagenes`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.message ?? "No se pudo subir la imagen.");
      } else {
        setMensaje("Imagen subida.");
      }
    } catch {
      setError("No se pudo procesar o subir la imagen.");
    } finally {
      setSubiendo(false);
      if (archivoRef.current) archivoRef.current.value = "";
    }
  }

  // Sube una imagen a un producto ya existente (modo edición).
  async function subirImagen(archivo: File) {
    if (!editando || !archivo) return;
    await subirImagenAProducto(editando.id, archivo);
    await recargar();
  }

  // Al seleccionar imágenes para un producto nuevo, acumula archivos y vistas previas.
  function manejarImagenesNuevas(evento: React.ChangeEvent<HTMLInputElement>) {
    const archivos = Array.from(evento.target.files ?? []);
    if (archivos.length === 0) return;
    setImagenesNuevas((prev) => [...prev, ...archivos]);
    setPreviewsNuevas((prev) => [
      ...prev,
      ...archivos.map((a) => URL.createObjectURL(a)),
    ]);
    if (archivoRef.current) archivoRef.current.value = "";
  }

  // Quita una imagen pendiente de subir (modo creación).
  function quitarImagenNueva(i: number) {
    setImagenesNuevas((prev) => prev.filter((_, idx) => idx !== i));
    setPreviewsNuevas((prev) => prev.filter((_, idx) => idx !== i));
  }

  // Elimina una imagen del producto.
  async function eliminarImagen(imagen: Imagen) {
    if (!editando) return;
    const resultado = await peticionAuth(
      `/api/admin/productos/imagenes/${imagen.id}`,
      token!,
      { method: "DELETE" },
    );
    if (!resultado.ok) {
      setError(resultado.mensaje ?? "No se pudo eliminar la imagen.");
      return;
    }
    setMensaje("Imagen eliminada.");
    await recargar();
  }

  // Abre el formulario para crear un producto.
  function abrirNuevo() {
    setEditando(null);
    setNombre("");
    setSlug("");
    setDescripcion("");
    setCategoriaId("");
    setPrecioBase("");
    setUmbralStockBajo("5");
    setVariantes([{ talla: "", color: "", stock: "", precio: "" }]);
    setImagenesNuevas([]);
    setPreviewsNuevas([]);
    setError("");
    setFormAbierto(true);
  }

  // Abre el formulario para editar un producto existente.
  function abrirEditar(p: Producto) {
    setEditando(p);
    setNombre(p.nombre);
    setSlug(p.slug);
    setDescripcion(p.descripcion);
    setCategoriaId(p.categoriaId ?? "");
    setPrecioBase(String(p.precio));
    setUmbralStockBajo(String(p.umbralStock));
    setVariantes(
      p.variantes.length > 0
        ? p.variantes.map((v) => ({
            talla: v.talla,
            color: v.color,
            stock: String(v.stock),
            precio: String(v.precio),
          }))
        : [{ talla: "", color: "", stock: "", precio: "" }],
    );
    setError("");
    setFormAbierto(true);
  }

  // Actualiza una fila de variante.
  function actualizarVariante(i: number, campo: keyof FilaVariante, valor: string) {
    setVariantes((prev) => prev.map((v, idx) => (idx === i ? { ...v, [campo]: valor } : v)));
  }

  function agregarVariante() {
    setVariantes((prev) => [...prev, { talla: "", color: "", stock: "", precio: "" }]);
  }

  function quitarVariante(i: number) {
    setVariantes((prev) => prev.filter((_, idx) => idx !== i));
  }

  // Guarda (crea o actualiza) el producto.
  async function guardar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError("");
    setMensaje("");
    setCargando(true);

    // Convierte las variantes al formato del backend.
    const variantesLimpias = variantes
      .filter((v) => v.talla.trim() && v.color.trim())
      .map((v) => ({
        talla: v.talla.trim(),
        color: v.color.trim(),
        stock: Number(v.stock) || 0,
        ...(v.precio ? { precio: Number(v.precio) } : {}),
      }));

    const cuerpo: Record<string, unknown> = {
      nombre,
      slug,
      descripcion,
      categoriaId: categoriaId || undefined,
      precioBase: Number(precioBase) || 0,
      umbralStockBajo: Number(umbralStockBajo) || 5,
      variantes: variantesLimpias,
    };

    let nuevoId: string | null = null;
    let ok = false;
    let mensajeError = "No se pudo guardar el producto.";

    if (editando) {
      const r = await peticionAuth(`/api/admin/productos/${editando.id}`, token!, {
        method: "PATCH",
        body: JSON.stringify(cuerpo),
      });
      ok = r.ok;
      mensajeError = r.mensaje ?? mensajeError;
    } else {
      const r = await peticionAuth<{ id: string }>("/api/admin/productos", token!, {
        method: "POST",
        body: JSON.stringify(cuerpo),
      });
      ok = r.ok;
      mensajeError = r.mensaje ?? mensajeError;
      if (r.data?.id) nuevoId = r.data.id;
    }

    setCargando(false);

    if (ok) {
      // Sube las imágenes adjuntas (solo en creación).
      if (nuevoId && imagenesNuevas.length > 0) {
        for (const archivo of imagenesNuevas) {
          await subirImagenAProducto(nuevoId, archivo);
        }
      }
      setFormAbierto(false);
      setMensaje(editando ? "Producto actualizado." : "Producto creado.");
      await recargar();
    } else {
      setError(mensajeError);
    }
  }

  // Desactiva un producto.
  async function desactivar(p: Producto) {
    if (!confirm(`¿Desactivar "${p.nombre}"?`)) return;
    await peticionAuth(`/api/admin/productos/${p.id}`, token!, { method: "DELETE" });
    setMensaje("Producto desactivado.");
    await recargar();
  }

  // Oculta/muestra el producto en el catálogo (sin eliminarlo).
  async function alternarVisibilidad(p: Producto) {
    await peticionAuth(`/api/admin/productos/${p.id}`, token!, {
      method: "PATCH",
      body: JSON.stringify({ estaActivo: !p.estaActivo }),
    });
    setMensaje(p.estaActivo ? "Producto oculto del catálogo." : "Producto visible nuevamente.");
    await recargar();
  }

  // Lista filtrada por la búsqueda (difusa, tolera errores).
  const productosFiltrados = filtrarPorBusqueda(lista, busqueda, (p) => p.nombre);

  return (
    <div className="space-y-4">
      {/* Cabecera. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-marron-500">{lista.length} productos en el catálogo</p>
        <button
          type="button"
          onClick={abrirNuevo}
          className="rounded-full bg-marron-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-marron-800"
        >
          + Nuevo producto
        </button>
      </div>

      {/* Buscador. */}
      <input
        type="search"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar por nombre (tolera errores ortográficos)…"
        className="w-full max-w-md rounded-full border border-marron-200 bg-white px-4 py-2 text-sm outline-none focus:border-marron-500"
      />

      {/* Mensajes. */}
      {mensaje && (
        <p className="rounded-lg bg-green-100 px-3 py-2 text-sm font-medium text-green-800">{mensaje}</p>
      )}
      {error && (
        <p className="rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700">{error}</p>
      )}

      {/* Formulario crear/editar. */}
      {formAbierto && (
        <form onSubmit={guardar} className="rounded-xl border border-marron-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-display text-lg font-bold text-marron-900">
            {editando ? "Editar producto" : "Nuevo producto"}
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-marron-700">Nombre</span>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="w-full rounded-lg border border-marron-200 px-3 py-2 outline-none focus:border-marron-500"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-marron-700">Slug (URL)</span>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                placeholder="nombre-del-producto"
                className="w-full rounded-lg border border-marron-200 px-3 py-2 outline-none focus:border-marron-500"
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block font-medium text-marron-700">Descripción</span>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-marron-200 px-3 py-2 outline-none focus:border-marron-500"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-marron-700">Categoría</span>
              <select
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                className="w-full rounded-lg border border-marron-200 bg-white px-3 py-2 outline-none focus:border-marron-500"
              >
                <option value="">Sin categoría</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-marron-700">Precio base (Q)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={precioBase}
                onChange={(e) => setPrecioBase(e.target.value)}
                required
                className="w-full rounded-lg border border-marron-200 px-3 py-2 outline-none focus:border-marron-500"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-marron-700">Umbral de stock bajo</span>
              <input
                type="number"
                min="0"
                value={umbralStockBajo}
                onChange={(e) => setUmbralStockBajo(e.target.value)}
                className="w-full rounded-lg border border-marron-200 px-3 py-2 outline-none focus:border-marron-500"
              />
              <span className="mt-1 block text-xs text-marron-400">
                Dispara alerta y notificación cuando el stock baja a este valor.
              </span>
            </label>
          </div>

          {/* Variantes. */}
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-medium text-marron-700">Variantes (talla, color, stock)</span>
              <button
                type="button"
                onClick={agregarVariante}
                className="text-sm font-medium text-marron-600 hover:underline"
              >
                + Añadir variante
              </button>
            </div>
            <div className="space-y-2">
              {variantes.map((v, i) => (
                <div key={i} className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  <input
                    value={v.talla}
                    onChange={(e) => actualizarVariante(i, "talla", e.target.value)}
                    placeholder="Talla"
                    className="rounded-lg border border-marron-200 px-3 py-2 text-sm outline-none focus:border-marron-500"
                  />
                  <input
                    value={v.color}
                    onChange={(e) => actualizarVariante(i, "color", e.target.value)}
                    placeholder="Color"
                    className="rounded-lg border border-marron-200 px-3 py-2 text-sm outline-none focus:border-marron-500"
                  />
                  <input
                    type="number"
                    min="0"
                    value={v.stock}
                    onChange={(e) => actualizarVariante(i, "stock", e.target.value)}
                    placeholder="Stock"
                    className="rounded-lg border border-marron-200 px-3 py-2 text-sm outline-none focus:border-marron-500"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={v.precio}
                    onChange={(e) => actualizarVariante(i, "precio", e.target.value)}
                    placeholder="Precio (opcional)"
                    className="rounded-lg border border-marron-200 px-3 py-2 text-sm outline-none focus:border-marron-500"
                  />
                  <button
                    type="button"
                    onClick={() => quitarVariante(i)}
                    className="rounded-lg border border-marron-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Imagen del producto (adjuntar al crear, gestionar al editar). */}
          <div className="mt-4 rounded-lg border border-dashed border-marron-200 p-4">
            <span className="mb-2 block font-medium text-marron-700">Imagen del producto</span>

            {editando ? (
              <>
                <div className="flex flex-wrap gap-3">
                  {editando.imagenes.map((img) => (
                    <div key={img.id} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={editando.nombre}
                        className="h-24 w-24 rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => eliminarImagen(img)}
                        className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white hover:bg-red-700"
                        title="Eliminar imagen"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <input
                    ref={archivoRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const archivo = e.target.files?.[0];
                      if (archivo) subirImagen(archivo);
                    }}
                    className="text-sm text-marron-600 file:mr-3 file:rounded-full file:border-0 file:bg-marron-700 file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-marron-800"
                  />
                  {subiendo && <span className="text-sm text-marron-500">Subiendo…</span>}
                </div>
              </>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                {previewsNuevas.map((preview, i) => (
                  <div key={i} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview}
                      alt="Vista previa"
                      className="h-24 w-24 rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => quitarImagenNueva(i)}
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white hover:bg-red-700"
                      title="Quitar imagen"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={manejarImagenesNuevas}
                  className="text-sm text-marron-600 file:mr-3 file:rounded-full file:border-0 file:bg-marron-700 file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-marron-800"
                />
                {imagenesNuevas.length > 0 && (
                  <span className="text-sm text-marron-500">
                    {imagenesNuevas.length} imagen(es) por subir
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={cargando}
              className="rounded-full bg-marron-700 px-6 py-2 text-sm font-semibold text-white transition hover:bg-marron-800 disabled:opacity-60"
            >
              {cargando ? "Guardando…" : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => setFormAbierto(false)}
              className="rounded-full border border-marron-200 px-6 py-2 text-sm font-medium text-marron-700 hover:bg-marron-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Tabla de productos. */}
      <div className="overflow-x-auto rounded-xl border border-marron-100 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-marron-100 bg-marron-50 text-xs uppercase tracking-wide text-marron-500">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-marron-50">
            {productosFiltrados.map((p) => {
              const bajoStock = p.stockTotal <= p.umbralStock;
              return (
                <tr key={p.id} className="hover:bg-marron-50/50">
                  <td className="px-4 py-3">
                    <span className="font-medium text-marron-900">{p.nombre}</span>
                  </td>
                  <td className="px-4 py-3 text-marron-600">{p.categoriaNombre}</td>
                  <td className="px-4 py-3 font-medium text-marron-800">
                    {formatearPrecio(p.precio)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${bajoStock ? "text-amber-600" : "text-green-700"}`}>
                      {p.stockTotal}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => alternarVisibilidad(p)}
                        title={p.estaActivo ? "Ocultar del catálogo" : "Mostrar en el catálogo"}
                        aria-label={p.estaActivo ? "Ocultar del catálogo" : "Mostrar en el catálogo"}
                        className={`text-lg leading-none ${p.estaActivo ? "text-marron-500 hover:text-marron-800" : "text-red-500 hover:text-red-700"}`}
                      >
                        {p.estaActivo ? "👁" : "🚫"}
                      </button>
                      <Link
                        href={`/producto/${p.id}`}
                        className="font-medium text-marron-600 hover:underline"
                      >
                        Ver
                      </Link>
                      <button
                        type="button"
                        onClick={() => abrirEditar(p)}
                        className="font-medium text-marron-600 hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => desactivar(p)}
                        className="font-medium text-red-600 hover:underline"
                      >
                        Desactivar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
