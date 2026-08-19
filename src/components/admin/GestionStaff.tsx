// =====================================================================
// GESTIÓN DE STAFF (cliente)
// ---------------------------------------------------------------------
// Componente cliente del apartado "Staff". Solo el administrador puede
// ver/crear/editar/desactivar perfiles de staff. Las mutaciones van
// autenticadas con el token JWT del usuario logueado.
// =====================================================================

"use client";

import { useState } from "react";
import { useAuth } from "@/lib/contexto/auth";
import { peticion, peticionAuth } from "@/lib/api";
import { formatearFecha } from "@/lib/util";
import type { Staff } from "@/lib/tipos";

export function GestionStaff({ staffInicial }: { staffInicial: Staff[] }) {
  const { token, autenticado, esAdmin } = useAuth();

  const [lista, setLista] = useState<Staff[]>(staffInicial);
  const [formAbierto, setFormAbierto] = useState(false);
  const [editando, setEditando] = useState<Staff | null>(null);
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [telefono, setTelefono] = useState("");
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  // Si no es admin, no se muestra la gestión.
  if (!autenticado || !esAdmin) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-marron-100 bg-white py-16 text-center">
        <span className="text-5xl">🔐</span>
        <p className="text-lg font-medium text-marron-800">
          Inicia sesión como administrador para gestionar el staff.
        </p>
      </div>
    );
  }

  // Recarga la lista de staff desde la API.
  async function recargar() {
    const datos = await peticion<Staff[]>("/api/admin/staff");
    if (datos) setLista(datos);
  }

  // Abre el formulario para crear un staff nuevo.
  function abrirNuevo() {
    setEditando(null);
    setNombre("");
    setCorreo("");
    setPassword("");
    setTelefono("");
    setError("");
    setFormAbierto(true);
  }

  // Abre el formulario para editar un staff existente.
  function abrirEditar(s: Staff) {
    setEditando(s);
    setNombre(s.nombre);
    setCorreo(s.email);
    setPassword("");
    setTelefono(s.telefono ?? "");
    setError("");
    setFormAbierto(true);
  }

  // Guarda (crea o actualiza) el perfil de staff.
  async function guardar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError("");
    setMensaje("");
    setCargando(true);

    const cuerpo: Record<string, unknown> = { nombre, correo, telefono };
    if (password) cuerpo.password = password;

    const resultado = editando
      ? await peticionAuth<Staff>(`/api/admin/staff/${editando.id}`, token!, {
          method: "PATCH",
          body: JSON.stringify(cuerpo),
        })
      : await peticionAuth<Staff>("/api/admin/staff", token!, {
          method: "POST",
          body: JSON.stringify({ ...cuerpo, password }),
        });

    setCargando(false);

    if (resultado.ok) {
      setFormAbierto(false);
      setMensaje(editando ? "Perfil actualizado." : "Perfil de staff creado.");
      await recargar();
    } else {
      setError(resultado.mensaje ?? "No se pudo guardar el perfil.");
    }
  }

  // Desactiva un perfil de staff.
  async function desactivar(s: Staff) {
    if (!confirm(`¿Desactivar el perfil de ${s.nombre}?`)) return;
    await peticionAuth(`/api/admin/staff/${s.id}`, token!, { method: "DELETE" });
    setMensaje("Perfil desactivado.");
    await recargar();
  }

  // Reactiva un perfil de staff.
  async function reactivar(s: Staff) {
    await peticionAuth(`/api/admin/staff/${s.id}`, token!, {
      method: "PATCH",
      body: JSON.stringify({ estaActivo: true }),
    });
    setMensaje("Perfil reactivado.");
    await recargar();
  }

  return (
    <div className="space-y-4">
      {/* Cabecera. */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-marron-500">{lista.length} perfiles de staff</p>
        <button
          type="button"
          onClick={abrirNuevo}
          className="rounded-full bg-marron-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-marron-800"
        >
          + Nuevo staff
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
            {editando ? "Editar staff" : "Nuevo perfil de staff"}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-marron-700">Nombre completo</span>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="w-full rounded-lg border border-marron-200 px-3 py-2 outline-none focus:border-marron-500"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-marron-700">Correo</span>
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
                className="w-full rounded-lg border border-marron-200 px-3 py-2 outline-none focus:border-marron-500"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-marron-700">
                Contraseña {editando && "(dejar vacía para no cambiar)"}
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!editando}
                minLength={6}
                className="w-full rounded-lg border border-marron-200 px-3 py-2 outline-none focus:border-marron-500"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-marron-700">Teléfono</span>
              <input
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
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

      {/* Tabla de staff. */}
      <div className="overflow-x-auto rounded-xl border border-marron-100 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-marron-100 bg-marron-50 text-xs uppercase tracking-wide text-marron-500">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Correo</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Registro</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-marron-50">
            {lista.map((s) => (
              <tr key={s.id} className="hover:bg-marron-50/50">
                <td className="px-4 py-3 font-medium text-marron-900">{s.nombre}</td>
                <td className="px-4 py-3 text-marron-600">{s.email}</td>
                <td className="px-4 py-3 text-marron-600">{s.telefono ?? "—"}</td>
                <td className="px-4 py-3 text-marron-600">{formatearFecha(s.fechaRegistro)}</td>
                <td className="px-4 py-3">
                  {s.estaActivo ? (
                    <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                      Activo
                    </span>
                  ) : (
                    <span className="rounded-full bg-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600">
                      Inactivo
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => abrirEditar(s)}
                      className="font-medium text-marron-600 hover:underline"
                    >
                      Editar
                    </button>
                    {s.estaActivo ? (
                      <button
                        type="button"
                        onClick={() => desactivar(s)}
                        className="font-medium text-red-600 hover:underline"
                      >
                        Desactivar
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => reactivar(s)}
                        className="font-medium text-green-600 hover:underline"
                      >
                        Reactivar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {lista.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-marron-500">
                  No hay perfiles de staff. Crea el primero con el botón «Nuevo staff».
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
