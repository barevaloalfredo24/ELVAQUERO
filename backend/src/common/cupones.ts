// =====================================================================
// REGLAS DE CUPONES (compartidas)
// ---------------------------------------------------------------------
// Valida si un cupón puede aplicarse y calcula el descuento sobre un
// subtotal. Se usa en la validación pública y al crear la orden.
// =====================================================================

// Forma mínima de un cupón necesaria para validar.
export interface CuponParaValidar {
  esta_activo: boolean;
  fecha_inicio_validez: Date;
  fecha_fin_validez: Date;
  limite_uso: number | null;
  veces_usado: number;
  tipo_descuento: string;
  valor_descuento: unknown;
  monto_minimo_orden: unknown;
}

// Comprueba que el cupón sea aplicable al subtotal dado.
export function validarCupon(
  c: CuponParaValidar,
  subtotal: number,
  ahora: Date = new Date(),
): { valido: boolean; mensaje?: string } {
  if (!c.esta_activo)
    return { valido: false, mensaje: 'El cupón no está activo.' };
  if (ahora < c.fecha_inicio_validez) {
    return { valido: false, mensaje: 'El cupón aún no es válido.' };
  }
  if (ahora > c.fecha_fin_validez) {
    return { valido: false, mensaje: 'El cupón ha expirado.' };
  }
  if (c.limite_uso !== null && c.veces_usado >= c.limite_uso) {
    return { valido: false, mensaje: 'El cupón alcanzó su límite de usos.' };
  }
  const minimo = Number(c.monto_minimo_orden ?? 0);
  if (subtotal < minimo) {
    return {
      valido: false,
      mensaje: `Este cupón requiere una compra mínima de Q${minimo.toFixed(2)}.`,
    };
  }
  return { valido: true };
}

// Calcula el monto de descuento (porcentaje o fijo, sin exceder el subtotal).
export function calcularDescuento(
  c: { tipo_descuento: string; valor_descuento: unknown },
  subtotal: number,
): number {
  const valor = Number(c.valor_descuento);
  const descuento =
    c.tipo_descuento === 'porcentaje'
      ? (subtotal * valor) / 100
      : Math.min(valor, subtotal);
  return Math.round(descuento * 100) / 100;
}
