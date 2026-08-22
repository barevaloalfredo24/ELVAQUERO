// =====================================================================
// DTOs DE RESEÑAS
// =====================================================================

import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

// Datos para crear/actualizar una reseña de producto.
export class CrearResenaDto {
  @IsInt({ message: 'La calificación debe ser un número entero.' })
  @Min(1, { message: 'La calificación mínima es 1 estrella.' })
  @Max(5, { message: 'La calificación máxima es 5 estrellas.' })
  calificacion: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  comentario?: string;
}
