// =====================================================================
// PÁGINA ADMIN: CLIENTES REGISTRADOS
// ---------------------------------------------------------------------
// Componente de servidor que lista los clientes con su estado de
// verificación y método de registro. Incluye contadores de resumen,
// útiles para campañas de reactivación (quién se registró y no compró).
// =====================================================================

import { obtenerClientes } from "@/lib/servicios/admin";
import { formatearFecha } from "@/lib/util";
import { TarjetaEstadistica } from "@/components/admin/AdminUtil";

export default async function PaginaClientes() {
  const clientes = await obtenerClientes();

  // Resumen de clientes según su estado.
  const verificados = clientes.filter((c) => c.verificado).length;
  const sinVerificar = clientes.length - verificados;
  const conGoogle = clientes.filter((c) => c.metodoRegistro === "google").length;

  return (
    <div className="space-y-6">
      {/* Tarjetas de resumen. */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <TarjetaEstadistica titulo="Total clientes" valor={String(clientes.length)} icono="👥" />
        <TarjetaEstadistica titulo="Verificados" valor={String(verificados)} icono="✅" />
        <TarjetaEstadistica titulo="Sin verificar" valor={String(sinVerificar)} icono="⏳" />
        <TarjetaEstadistica titulo="Con Google" valor={String(conGoogle)} icono="G" />
      </div>

      {/* Tabla de clientes. */}
      <div className="overflow-x-auto rounded-xl border border-marron-100 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-marron-100 bg-marron-50 text-xs uppercase tracking-wide text-marron-500">
            <tr>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Registro</th>
              <th className="px-4 py-3">Método</th>
              <th className="px-4 py-3">Verificación</th>
              <th className="px-4 py-3">Teléfono</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-marron-50">
            {clientes.map((c) => (
              <tr key={c.id} className="hover:bg-marron-50/50">
                <td className="px-4 py-3 font-medium text-marron-900">{c.nombre}</td>
                <td className="px-4 py-3 text-marron-600">{c.email}</td>
                <td className="px-4 py-3 text-marron-600">{formatearFecha(c.fechaRegistro)}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-marron-100 px-2.5 py-1 text-xs font-medium text-marron-700">
                    {c.metodoRegistro === "google" ? "Google" : "Correo"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {c.verificado ? (
                    <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                      Verificado
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                      Sin verificar
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-marron-600">{c.telefono ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
