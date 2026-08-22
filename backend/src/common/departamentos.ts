// =====================================================================
// DEPARTAMENTOS DE GUATEMALA
// ---------------------------------------------------------------------
// Lista de departamentos válidos para la cobertura de envío. Se usa para
// validar la dirección de entrega de las órdenes.
// =====================================================================

export const DEPARTAMENTOS_GUATEMALA: string[] = [
  'Alta Verapaz',
  'Baja Verapaz',
  'Chimaltenango',
  'Chiquimula',
  'Guatemala',
  'El Progreso',
  'Escuintla',
  'Huehuetenango',
  'Izabal',
  'Jalapa',
  'Jutiapa',
  'Petén',
  'Quetzaltenango',
  'Quiché',
  'Retalhuleu',
  'Sacatepéquez',
  'San Marcos',
  'Santa Rosa',
  'Sololá',
  'Suchitepéquez',
  'Totonicapán',
  'Zacapa',
];

// Verifica que un departamento sea válido (dentro de Guatemala).
export function esDepartamentoValido(departamento: string): boolean {
  return DEPARTAMENTOS_GUATEMALA.includes(departamento?.trim());
}
