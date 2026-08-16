// =====================================================================
// LAYOUT DEL PANEL ADMINISTRATIVO
// ---------------------------------------------------------------------
// Componente de servidor que envuelve las páginas de administración
// con el "esqueleto" (sidebar + encabezado) definido en <AdminShell />.
// =====================================================================

import { AdminShell } from "@/components/admin/AdminShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
