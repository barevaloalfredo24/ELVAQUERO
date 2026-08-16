// =====================================================================
// PÁGINA DE CONFIRMACIÓN DE PEDIDO (servidor)
// ---------------------------------------------------------------------
// Lee el id de la orden desde la URL y lo pasa a un componente cliente
// que muestra el resumen final de la compra.
// =====================================================================

import { ConfirmacionPedido } from "@/components/tienda/ConfirmacionPedido";

export default async function PaginaGracias({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const ordenId = typeof params.orden === "string" ? params.orden : undefined;

  return <ConfirmacionPedido ordenId={ordenId} />;
}
