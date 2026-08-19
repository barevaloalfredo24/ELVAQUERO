// =====================================================================
// GESTIÓN DE CATEGORÍAS (cliente)
// ---------------------------------------------------------------------
// CRUD de categorías para el administrador. Las mutaciones van
// autenticadas con el token JWT.
// =====================================================================

"use client";

import { useState } from "react";
import { useAuth } from "@/lib/contexto/auth";
import { peticionAuth } from "@/lib/api";
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
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  // Solo el administrador puede gestionar categorías.
  if (!autenticado || !esAdmin) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-marron-100 bg-white py-16 text-center">
        <span className="text-5xl">🔐</span>
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
    setError("");
    setFormAbierto(true);
  }

  // Abre el formulario para editar.
  function abrirEditar(c: Categoria) {
    setEditando(c);
    setNombre(c.nombre);
    setSlug(c.slug);
    setCategoriaPadreId("");
    setError("");
    setFormAbierto(true);
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
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="border-b border-marron-100 bg-marron-50 text-xs uppercase tracking-wide text-marron-500">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-marron-50">
            {lista.map((c) => (
              <tr key={c.id} className="hover:bg-marron-50/50">
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
                <td colSpan={3} className="px-4 py-10 text-center text-marron-500">
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
