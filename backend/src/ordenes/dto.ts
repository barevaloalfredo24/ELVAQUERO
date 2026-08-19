// =====================================================================
// DTOs DE ÓRDENES (con validación)
// =====================================================================

import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

// Línea de la orden enviada por el cliente.
export class ItemOrdenDto {
  @IsString()
  @IsNotEmpty()
  varianteId: string;

  @IsInt()
  @Min(1)
  cantidad: number;
}

// Datos para crear una orden.
export class CrearOrdenDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ItemOrdenDto)
  items: ItemOrdenDto[];

  @IsIn(['tarjeta', 'contra_entrega'])
  metodoPago: 'tarjeta' | 'contra_entrega';

  @IsString()
  @IsNotEmpty()
  direccionEnvio: string;

  @IsString()
  @IsNotEmpty()
  telefono: string;

  @IsOptional()
  @IsString()
  cuponCodigo?: string;
}
