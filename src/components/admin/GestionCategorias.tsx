// =====================================================================
// GESTIÓN DE CATEGORÍAS (cliente)
// ---------------------------------------------------------------------
// CRUD de categorías para el administrador. Permite agregar una imagen
// (con su texto alternativo). Las mutaciones van autenticadas con JWT.
// =====================================================================

"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/lib/contexto/auth";
import { API_URL, peticionAuth } from "@/lib/api";
import { obtenerCategorias } from "@/lib/servicios/catalogo";
import type { Categoria } from "@/lib/tipos";

export function GestionCategorias({ categoriasInicial }: { categoriasInicial: Categoria[] }) {
  const { token, autenticado, esAdmin } = useAuth();

  const [lista, setLista] = useState<Categoria[]>(categoriasInicial);
  const [formAbierto, setFormAbierto] = useState(false);
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [nombre, setNombre] = useState("");
  const [slug, setSlug] = useState("");
  const [categoriaPadreId, setCategoriaPadreId] = useState("");
  const [imagen, setImagen] = useState("");
  const [alt, setAlt] = useState("");
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const archivoRef = useRef<HTMLInputElement>(null);

  // Solo el administrador puede gestionar categorías.
  if (!autenticado || !esAdmin) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-marron-100 bg-white py-16 text-center">
        <p className="text-lg font-medium text-marron-800">
          Inicia sesión como administrador para gestionar las categorías.
        </p>
      </div>
    );
  }

  // Recarga la lista de categorías.
  async function recargar() {
    const datos = await obtenerCategorias();
    setLista(datos);
  }

  // Abre el formulario para crear.
  function abrirNuevo() {
    setEditando(null);
    setNombre("");
    setSlug("");
    setCategoriaPadreId("");
    setImagen("");
    setAlt("");
    setError("");
    setFormAbierto(true);
  }

  // Abre el formulario para editar.
  function abrirEditar(c: Categoria) {
    setEditando(c);
    setNombre(c.nombre);
    setSlug(c.slug);
    setCategoriaPadreId("");
    setImagen(c.imagen ?? "");
    setAlt(c.alt ?? "");
    setError("");
    setFormAbierto(true);
  }

  // Sube la imagen de la categoría a Cloudinary y guarda la URL.
  async function subirImagen(archivo: File) {
    if (!archivo) return;
    setSubiendo(true);
    setError("");
    const formData = new FormData();
    formData.append("imagen", archivo);
    try {
      const res = await fetch(`${API_URL}/api/admin/categorias/imagen`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.message ?? "No se pudo subir la imagen.");
      } else {
        const data = await res.json();
        setImagen(data.url ?? "");
        if (!alt.trim()) setAlt(nombre.trim());
        setMensaje("Imagen subida.");
      }
    } catch {
      setError("Error de conexión al subir la imagen.");
    } finally {
      setSubiendo(false);
      if (archivoRef.current) archivoRef.current.value = "";
    }
  }

  // Guarda (crea o actualiza) la categoría.
  async function guardar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError("");
    setMensaje("");
    setCargando(true);

    const cuerpo: Record<string, unknown> = {
      nombre,
      slug,
      categoriaPadreId: categoriaPadreId || undefined,
      imagen: imagen || undefined,
      alt: alt.trim() || nombre.trim(),
    };

    const resultado = editando
      ? await peticionAuth<Categoria>(`/api/admin/categorias/${editando.id}`, token!, {
          method: "PATCH",
          body: JSON.stringify(cuerpo),
        })
      : await peticionAuth<Categoria>("/api/admin/categorias", token!, {
          method: "POST",
          body: JSON.stringify(cuerpo),
        });

    setCargando(false);

    if (resultado.ok) {
      setFormAbierto(false);
      setMensaje(editando ? "Categoría actualizada." : "Categoría creada.");
      await recargar();
    } else {
      setError(resultado.mensaje ?? "No se pudo guardar la categoría.");
    }
  }

  // Elimina una categoría.
  async function eliminar(c: Categoria) {
    if (!confirm(`¿Eliminar la categoría "${c.nombre}"? Los productos quedarán sin categoría.`)) {
      return;
    }
    const resultado = await peticionAuth(`/api/admin/categorias/${c.id}`, token!, {
      method: "DELETE",
    });
    if (!resultado.ok) {
      setError(resultado.mensaje ?? "No se pudo eliminar la categoría.");
      return;
    }
    setMensaje("Categoría eliminada.");
    await recargar();
  }

  return (
    <div className="space-y-4">
      {/* Cabecera. */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-marron-500">{lista.length} categorías</p>
        <button
          type="button"
          onClick={abrirNuevo}
          className="rounded-full bg-marron-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-marron-800"
        >
          + Nueva categoría
        </button>
      </div>

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
            {editando ? "Editar categoría" : "Nueva categoría"}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-marron-700">Nombre</span>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="w-full rounded-lg border border-marron-200 px-3 py-2 outline-none focus:border-marron-500"
                placeholder="Botas"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-marron-700">Slug (URL)</span>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                className="w-full rounded-lg border border-marron-200 px-3 py-2 outline-none focus:border-marron-500"
                placeholder="botas"
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block font-medium text-marron-700">Categoría padre (opcional)</span>
              <select
                value={categoriaPadreId}
                onChange={(e) => setCategoriaPadreId(e.target.value)}
                className="w-full rounded-lg border border-marron-200 bg-white px-3 py-2 outline-none focus:border-marron-500"
              >
                <option value="">Sin categoría padre</option>
                {lista
                  .filter((c) => c.id !== editando?.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
              </select>
            </label>

            {/* Imagen de la categoría. */}
            <div className="sm:col-span-2">
              <span className="mb-1 block text-sm font-medium text-marron-700">Imagen</span>
              <div className="flex flex-wrap items-start gap-4">
                {imagen && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagen}
                    alt={alt || nombre}
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
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
                  {subiendo && <span className="ml-2 text-sm text-marron-500">Subiendo…</span>}
                </div>
              </div>
            </div>

            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block font-medium text-marron-700">Texto alternativo (alt)</span>
              <input
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                placeholder={nombre || "Texto alternativo de la imagen"}
                className="w-full rounded-lg border border-marron-200 px-3 py-2 outline-none focus:border-marron-500"
              />
            </label>
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

      {/* Tabla de categorías. */}
      <div className="overflow-x-auto rounded-xl border border-marron-100 bg-white shadow-sm">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="border-b border-marron-100 bg-marron-50 text-xs uppercase tracking-wide text-marron-500">
            <tr>
              <th className="px-4 py-3">Imagen</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-marron-50">
            {lista.map((c) => (
              <tr key={c.id} className="hover:bg-marron-50/50">
                <td className="px-4 py-3">
                  {c.imagen ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.imagen} alt={c.alt ?? c.nombre} className="h-10 w-10 rounded-lg object-cover" />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-marron-100 text-xs text-marron-400">
                      —
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 font-medium text-marron-900">{c.nombre}</td>
                <td className="px-4 py-3 text-marron-600">{c.slug}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => abrirEditar(c)}
                      className="font-medium text-marron-600 hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => eliminar(c)}
                      className="font-medium text-red-600 hover:underline"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {lista.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-marron-500">
                  No hay categorías. Crea la primera con el botón «Nueva categoría».
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
