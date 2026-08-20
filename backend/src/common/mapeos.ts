// =====================================================================
// MAPEOS COMPARTIDOS (DB -> frontend)
// ---------------------------------------------------------------------
// Convierte los valores de los enums de la base de datos a los valores
// que usa el frontend (que se definieron durante la fase de mock).
// =====================================================================

// Estado de orden: la BD usa 'pagado', 'enviado', 'entregado'... y el
// frontend usa 'pagada', 'enviada', 'entregada'... Se hace la traducción
// aquí para no duplicar la lógica en cada servicio.
export function mapearEstado(estado: string, metodoPago?: string): string {
  // Una orden contra entrega "pendiente" equivale a "pago_pendiente".
  if (estado === 'pendiente' && metodoPago === 'contra_entrega') {
    return 'pago_pendiente';
  }
  switch (estado) {
    case 'pagado':
      return 'pagada';
    case 'procesando':
      return 'pagada';
    case 'enviado':
      return 'enviada';
    case 'entregado':
      return 'entregada';
    case 'cancelado':
      return 'cancelada';
    case 'reembolsado':
      return 'cancelada';
    default:
      return 'pendiente';
  }
}

// Estado de pago: la BD usa 'exitoso', 'pendiente', etc. y el frontend
// usa 'pagado', 'pendiente', 'fallido', 'reembolsado'.
export function mapearEstadoPago(
  estadoPago: string | null | undefined,
): string {
  switch (estadoPago) {
    case 'exitoso':
      return 'pagado';
    case 'fallido':
      return 'fallido';
    case 'reembolsado':
      return 'reembolsado';
    default:
      return 'pendiente';
  }
}
