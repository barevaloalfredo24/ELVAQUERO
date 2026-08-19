// =====================================================================
// GESTIÓN DE CUPONES (cliente)
// ---------------------------------------------------------------------
// CRUD de cupones para el administrador. Las mutaciones van autenticadas
// con el token JWT.
// =====================================================================

"use client";

import { useState } from "react";
import { useAuth } from "@/lib/contexto/auth";
import { peticion, peticionAuth } from "@/lib/api";
import { formatearFecha, formatearPrecio } from "@/lib/util";
import type { Cupon } from "@/lib/tipos";

// Texto legible del valor del descuento.
function textoDescuento(c: Cupon): string {
  return c.tipoDescuento === "porcentaje"
    ? `${c.valorDescuento}%`
    : formatearPrecio(c.valorDescuento);
}

// Convierte una fecha ISO a "YYYY-MM-DD" para el input de tipo date.
function aFechaInput(iso: string): string {
  return iso.slice(0, 10);
}

export function GestionCupones({ cuponesInicial }: { cuponesInicial: Cupon[] }) {
  const { token, autenticado, esAdmin } = useAuth();

  const [lista, setLista] = useState<Cupon[]>(cuponesInicial);
  const [formAbierto, setFormAbierto] = useState(false);
  const [editando, setEditando] = useState<Cupon | null>(null);
  const [codigo, setCodigo] = useState("");
  const [tipoDescuento, setTipoDescuento] = useState<"porcentaje" | "fijo">("porcentaje");
  const [valorDescuento, setValorDescuento] = useState("");
  const [montoMinimoOrden, setMontoMinimoOrden] = useState("");
  const [limiteUso, setLimiteUso] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  if (!autenticado || !esAdmin) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-marron-100 bg-white py-16 text-center">
        <span className="text-5xl">🔐</span>
        <p className="text-lg font-medium text-marron-800">
          Inicia sesión como administrador para gestionar los cupones.
        </p>
      </div>
    );
  }

  // Recarga la lista de cupones.
  async function recargar() {
    const datos = await peticion<Cupon[]>("/api/admin/cupones");
    if (datos) setLista(datos);
  }

  // Abre el formulario para crear.
  function abrirNuevo() {
    setEditando(null);
    setCodigo("");
    setTipoDescuento("porcentaje");
    setValorDescuento("");
    setMontoMinimoOrden("");
    setLimiteUso("");
    setFechaInicio("");
    setFechaFin("");
    setError("");
    setFormAbierto(true);
  }

  // Abre el formulario para editar.
  function abrirEditar(c: Cupon) {
    setEditando(c);
    setCodigo(c.codigo);
    setTipoDescuento(c.tipoDescuento);
    setValorDescuento(String(c.valorDescuento));
    setMontoMinimoOrden(c.montoMinimoOrden ? String(c.montoMinimoOrden) : "");
    setLimiteUso(c.limiteUso ? String(c.limiteUso) : "");
    setFechaInicio(aFechaInput(c.fechaInicioValidez));
    setFechaFin(aFechaInput(c.fechaFinValidez));
    setError("");
    setFormAbierto(true);
  }

  // Guarda (crea o actualiza) el cupón.
  async function guardar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError("");
    setMensaje("");
    setCargando(true);

    const cuerpo: Record<string, unknown> = {
      codigo,
      tipoDescuento,
      valorDescuento: Number(valorDescuento) || 0,
      montoMinimoOrden: montoMinimoOrden ? Number(montoMinimoOrden) : 0,
      limiteUso: limiteUso ? Number(limiteUso) : undefined,
      fechaInicioValidez: fechaInicio ? new Date(`${fechaInicio}T00:00:00`).toISOString() : undefined,
      fechaFinValidez: fechaFin ? new Date(`${fechaFin}T23:59:59`).toISOString() : undefined,
    };

    const resultado = editando
      ? await peticionAuth<Cupon>(`/api/admin/cupones/${editando.id}`, token!, {
          method: "PATCH",
          body: JSON.stringify(cuerpo),
        })
      : await peticionAuth<Cupon>("/api/admin/cupones", token!, {
          method: "POST",
          body: JSON.stringify(cuerpo),
        });

    setCargando(false);

    if (resultado.ok) {
      setFormAbierto(false);
      setMensaje(editando ? "Cupón actualizado." : "Cupón creado.");
      await recargar();
    } else {
      setError(resultado.mensaje ?? "No se pudo guardar el cupón.");
    }
  }

  // Desactiva o reactiva un cupón.
  async function alternarActivo(c: Cupon) {
    await peticionAuth(`/api/admin/cupones/${c.id}`, token!, {
      method: "PATCH",
      body: JSON.stringify({ estaActivo: !c.estaActivo }),
    });
    setMensaje(c.estaActivo ? "Cupón desactivado." : "Cupón reactivado.");
    await recargar();
  }

  return (
    <div className="space-y-4">
      {/* Cabecera. */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-marron-500">{lista.length} cupones</p>
        <button
          type="button"
          onClick={abrirNuevo}
          className="rounded-full bg-marron-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-marron-800"
        >
          + Nuevo cupón
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
            {editando ? "Editar cupón" : "Nuevo cupón"}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-marron-700">Código</span>
              <input
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                required
                placeholder="VERANO10"
                className="w-full rounded-lg border border-marron-200 px-3 py-2 outline-none focus:border-marron-500"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-marron-700">Tipo de descuento</span>
              <select
                value={tipoDescuento}
                onChange={(e) => setTipoDescuento(e.target.value as "porcentaje" | "fijo")}
                className="w-full rounded-lg border border-marron-200 bg-white px-3 py-2 outline-none focus:border-marron-500"
              >
                <option value="porcentaje">Porcentaje (%)</option>
                <option value="fijo">Monto fijo (Q)</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-marron-700">
                Valor {tipoDescuento === "porcentaje" ? "(%)" : "(Q)"}
              </span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={valorDescuento}
                onChange={(e) => setValorDescuento(e.target.value)}
                required
                className="w-full rounded-lg border border-marron-200 px-3 py-2 outline-none focus:border-marron-500"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-marron-700">Monto mínimo (Q)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={montoMinimoOrden}
                onChange={(e) => setMontoMinimoOrden(e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-marron-200 px-3 py-2 outline-none focus:border-marron-500"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-marron-700">Límite de usos</span>
              <input
                type="number"
                min="1"
                value={limiteUso}
                onChange={(e) => setLimiteUso(e.target.value)}
                placeholder="Ilimitado"
                className="w-full rounded-lg border border-marron-200 px-3 py-2 outline-none focus:border-marron-500"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-marron-700">Inicio</span>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  required
                  className="w-full rounded-lg border border-marron-200 px-3 py-2 outline-none focus:border-marron-500"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-marron-700">Fin</span>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  required
                  className="w-full rounded-lg border border-marron-200 px-3 py-2 outline-none focus:border-marron-500"
                />
              </label>
            </div>
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

      {/* Tabla de cupones. */}
      <div className="overflow-x-auto rounded-xl border border-marron-100 bg-white shadow-sm">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-marron-100 bg-marron-50 text-xs uppercase tracking-wide text-marron-500">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Descuento</th>
              <th className="px-4 py-3">Mínimo</th>
              <th className="px-4 py-3">Usos</th>
              <th className="px-4 py-3">Vigencia</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-marron-50">
            {lista.map((c) => (
              <tr key={c.id} className="hover:bg-marron-50/50">
                <td className="px-4 py-3 font-semibold text-marron-900">{c.codigo}</td>
                <td className="px-4 py-3 font-medium text-marron-800">{textoDescuento(c)}</td>
                <td className="px-4 py-3 text-marron-600">
                  {c.montoMinimoOrden > 0 ? formatearPrecio(c.montoMinimoOrden) : "—"}
                </td>
                <td className="px-4 py-3 text-marron-600">
                  {c.vecesUsado}/{c.limiteUso ?? "∞"}
                </td>
                <td className="px-4 py-3 text-marron-600">
                  {formatearFecha(c.fechaInicioValidez)} → {formatearFecha(c.fechaFinValidez)}
                </td>
                <td className="px-4 py-3">
                  {c.estaActivo ? (
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
                      onClick={() => abrirEditar(c)}
                      className="font-medium text-marron-600 hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => alternarActivo(c)}
                      className={`font-medium hover:underline ${c.estaActivo ? "text-red-600" : "text-green-600"}`}
                    >
                      {c.estaActivo ? "Desactivar" : "Reactivar"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {lista.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-marron-500">
                  No hay cupones. Crea el primero con el botón «Nuevo cupón».
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
