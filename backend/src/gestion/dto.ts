// =====================================================================
// DTOs DE GESTIÓN (staff y productos)
// =====================================================================

import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

// ------------------------- STAFF -------------------------

// Datos para crear un perfil de staff.
export class CrearStaffDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  nombre: string;

  @IsEmail({}, { message: 'El correo no es válido.' })
  correo: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
  password: string;

  @IsOptional()
  @IsString()
  telefono?: string;
}

// ------------------------- PEDIDOS / SEGUIMIENTO -------------------------

// Datos para asignar un número de seguimiento a una orden.
export class AsignarSeguimientoDto {
  @IsString()
  @IsNotEmpty({ message: 'El número de seguimiento es obligatorio.' })
  numeroSeguimiento: string;

  @IsString()
  @IsNotEmpty({ message: 'La paquetería es obligatoria.' })
  paqueteria: string;
}

// ------------------------- CUPONES -------------------------

// Datos para crear un cupón.
export class CrearCuponDto {
  @IsString()
  @IsNotEmpty({ message: 'El código es obligatorio.' })
  codigo: string;

  @IsIn(['porcentaje', 'fijo'], { message: 'Tipo de descuento no válido.' })
  tipoDescuento: 'porcentaje' | 'fijo';

  @IsNumber()
  @Min(0.01, { message: 'El valor del descuento debe ser mayor a 0.' })
  valorDescuento: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  montoMinimoOrden?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  limiteUso?: number;

  @IsDateString()
  fechaInicioValidez: string;

  @IsDateString()
  fechaFinValidez: string;
}

// Datos para actualizar un cupón (todos opcionales).
export class ActualizarCuponDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  codigo?: string;

  @IsOptional()
  @IsIn(['porcentaje', 'fijo'])
  tipoDescuento?: 'porcentaje' | 'fijo';

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  valorDescuento?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  montoMinimoOrden?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  limiteUso?: number;

  @IsOptional()
  @IsDateString()
  fechaInicioValidez?: string;

  @IsOptional()
  @IsDateString()
  fechaFinValidez?: string;

  @IsOptional()
  @IsBoolean()
  estaActivo?: boolean;
}

// Datos para actualizar un perfil de staff (todos opcionales).
export class ActualizarStaffDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nombre?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El correo no es válido.' })
  correo?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
  password?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsBoolean()
  estaActivo?: boolean;
}

// ------------------------- PRODUCTOS -------------------------

// Variante de un producto (talla + color + stock + precio opcional).
export class VarianteDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @IsNotEmpty()
  talla: string;

  @IsString()
  @IsNotEmpty()
  color: string;

  @IsInt()
  @Min(0)
  stock: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  precio?: number;
}

// Datos para crear un producto.
export class CrearProductoDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  nombre: string;

  @IsString()
  @IsNotEmpty({ message: 'El slug es obligatorio.' })
  slug: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  categoriaId?: string;

  @IsNumber()
  @Min(0)
  precioBase: number;

  @IsOptional()
  @IsBoolean()
  estaActivo?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VarianteDto)
  variantes: VarianteDto[];
}

// Datos para actualizar un producto (todos opcionales).
export class ActualizarProductoDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nombre?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  slug?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  categoriaId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  precioBase?: number;

  @IsOptional()
  @IsBoolean()
  estaActivo?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VarianteDto)
  variantes?: VarianteDto[];
}

// ------------------------- CATEGORÍAS -------------------------

// Datos para crear una categoría.
export class CrearCategoriaDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  nombre: string;

  @IsString()
  @IsNotEmpty({ message: 'El slug es obligatorio.' })
  slug: string;

  @IsOptional()
  @IsString()
  categoriaPadreId?: string;
}

// Datos para actualizar una categoría (todos opcionales).
export class ActualizarCategoriaDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nombre?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  slug?: string;

  @IsOptional()
  @IsString()
  categoriaPadreId?: string;
}
