// =====================================================================
// SERVICIO DE CUPONES (GESTIÓN)
// ---------------------------------------------------------------------
// CRUD de cupones de descuento para el administrador. El "borrado" es
// lógico (esta_activo = false) para no romper las redenciones/órdenes.
// =====================================================================

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActualizarCuponDto, CrearCuponDto } from './dto';

// Forma del cupón que se devuelve al frontend.
export interface CuponDTO {
  id: string;
  codigo: string;
  tipoDescuento: string;
  valorDescuento: number;
  montoMinimoOrden: number;
  limiteUso: number | null;
  vecesUsado: number;
  fechaInicioValidez: string;
  fechaFinValidez: string;
  estaActivo: boolean;
}

// Mapea un registro de Prisma al DTO (Decimal -> number, fechas -> ISO).
export function aCuponDTO(c: {
  id: string;
  codigo: string;
  tipo_descuento: string;
  valor_descuento: unknown;
  monto_minimo_orden: unknown;
  limite_uso: number | null;
  veces_usado: number;
  fecha_inicio_validez: Date;
  fecha_fin_validez: Date;
  esta_activo: boolean;
}): CuponDTO {
  return {
    id: c.id,
    codigo: c.codigo,
    tipoDescuento: c.tipo_descuento,
    valorDescuento: Number(c.valor_descuento),
    montoMinimoOrden: Number(c.monto_minimo_orden ?? 0),
    limiteUso: c.limite_uso,
    vecesUsado: c.veces_usado,
    fechaInicioValidez: c.fecha_inicio_validez.toISOString(),
    fechaFinValidez: c.fecha_fin_validez.toISOString(),
    estaActivo: c.esta_activo,
  };
}

@Injectable()
export class CuponesGestionService {
  constructor(private prisma: PrismaService) {}

  // Crea un cupón.
  async crearCupon(dto: CrearCuponDto): Promise<CuponDTO> {
    const codigo = dto.codigo.trim().toUpperCase();
    const existente = await this.prisma.cupones.findUnique({
      where: { codigo },
    });
    if (existente)
      throw new ConflictException('Ya existe un cupón con ese código.');

    const cupon = await this.prisma.cupones.create({
      data: {
        codigo,
        tipo_descuento: dto.tipoDescuento,
        valor_descuento: dto.valorDescuento,
        monto_minimo_orden: dto.montoMinimoOrden ?? 0,
        limite_uso: dto.limiteUso ?? null,
        fecha_inicio_validez: new Date(dto.fechaInicioValidez),
        fecha_fin_validez: new Date(dto.fechaFinValidez),
        esta_activo: true,
      },
    });

    return aCuponDTO(cupon);
  }

  // Actualiza un cupón.
  async actualizarCupon(
    id: string,
    dto: ActualizarCuponDto,
  ): Promise<CuponDTO> {
    const cupon = await this.prisma.cupones.findUnique({ where: { id } });
    if (!cupon) throw new NotFoundException('Cupón no encontrado.');

    const data: Record<string, unknown> = {};
    if (dto.tipoDescuento !== undefined)
      data.tipo_descuento = dto.tipoDescuento;
    if (dto.valorDescuento !== undefined)
      data.valor_descuento = dto.valorDescuento;
    if (dto.montoMinimoOrden !== undefined)
      data.monto_minimo_orden = dto.montoMinimoOrden;
    if (dto.limiteUso !== undefined) data.limite_uso = dto.limiteUso;
    if (dto.estaActivo !== undefined) data.esta_activo = dto.estaActivo;
    if (dto.fechaInicioValidez !== undefined) {
      data.fecha_inicio_validez = new Date(dto.fechaInicioValidez);
    }
    if (dto.fechaFinValidez !== undefined) {
      data.fecha_fin_validez = new Date(dto.fechaFinValidez);
    }

    if (dto.codigo !== undefined) {
      const codigo = dto.codigo.trim().toUpperCase();
      if (codigo !== cupon.codigo) {
        const existente = await this.prisma.cupones.findUnique({
          where: { codigo },
        });
        if (existente)
          throw new ConflictException('Ya existe un cupón con ese código.');
      }
      data.codigo = codigo;
    }

    const actualizado = await this.prisma.cupones.update({
      where: { id },
      data,
    });

    return aCuponDTO(actualizado);
  }

  // Desactiva un cupón (borrado lógico).
  async desactivarCupon(id: string): Promise<{ id: string }> {
    const cupon = await this.prisma.cupones.findUnique({ where: { id } });
    if (!cupon) throw new NotFoundException('Cupón no encontrado.');

    await this.prisma.cupones.update({
      where: { id },
      data: { esta_activo: false },
    });
    return { id };
  }
}
