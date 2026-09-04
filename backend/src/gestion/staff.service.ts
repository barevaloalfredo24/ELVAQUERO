// =====================================================================
// SERVICIO DE STAFF
// ---------------------------------------------------------------------
// CRUD de perfiles de staff (usuarios con rol 'staff'). Solo accesible
// por el administrador (ver StaffController con @Roles('admin')).
// =====================================================================

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { ActualizarStaffDto, CrearStaffDto } from './dto';

// Forma del staff que se devuelve al frontend.
export interface StaffDTO {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  rol: 'admin' | 'staff';
  estaActivo: boolean;
  fechaRegistro: string;
}

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  // Lista todos los perfiles de personal (admin y staff).
  async listarStaff(): Promise<StaffDTO[]> {
    const staff = await this.prisma.usuarios.findMany({
      where: { rol: { in: ['admin', 'staff'] } },
      orderBy: { fecha_creacion: 'desc' },
    });
    return staff.map((u) => ({
      id: u.id,
      nombre: u.nombre_completo,
      email: u.correo,
      telefono: u.telefono,
      rol: u.rol as 'admin' | 'staff',
      estaActivo: u.esta_activo,
      fechaRegistro: u.fecha_creacion.toISOString(),
    }));
  }

  // Crea un perfil de personal (correo ya verificado, sin validación por email).
  async crearStaff(dto: CrearStaffDto): Promise<StaffDTO> {
    const correo = dto.correo.trim().toLowerCase();
    const existente = await this.prisma.usuarios.findUnique({
      where: { correo },
    });
    if (existente) {
      throw new ConflictException('Ya existe un usuario con ese correo.');
    }

    const contrasenaHash = await bcrypt.hash(dto.password, 10);
    const rol = dto.rol ?? 'staff';
    const usuario = await this.prisma.usuarios.create({
      data: {
        nombre_completo: dto.nombre.trim(),
        correo,
        contrasena_hash: contrasenaHash,
        telefono: dto.telefono ?? null,
        rol,
        correo_verificado: true,
      },
    });

    return {
      id: usuario.id,
      nombre: usuario.nombre_completo,
      email: usuario.correo,
      telefono: usuario.telefono,
      rol: usuario.rol as 'admin' | 'staff',
      estaActivo: usuario.esta_activo,
      fechaRegistro: usuario.fecha_creacion.toISOString(),
    };
  }

  // Actualiza los datos de un perfil de staff.
  async actualizarStaff(
    id: string,
    dto: ActualizarStaffDto,
  ): Promise<StaffDTO> {
    const usuario = await this.obtenerStaff(id);

    const data: Record<string, unknown> = {};
    if (dto.nombre !== undefined) data.nombre_completo = dto.nombre.trim();
    if (dto.telefono !== undefined) data.telefono = dto.telefono;
    if (dto.rol !== undefined) data.rol = dto.rol;
    if (dto.estaActivo !== undefined) data.esta_activo = dto.estaActivo;
    if (dto.password)
      data.contrasena_hash = await bcrypt.hash(dto.password, 10);

    if (dto.correo !== undefined) {
      const correo = dto.correo.trim().toLowerCase();
      if (correo !== usuario.correo) {
        const existente = await this.prisma.usuarios.findUnique({
          where: { correo },
        });
        if (existente)
          throw new ConflictException('Ya existe un usuario con ese correo.');
      }
      data.correo = correo;
    }

    const actualizado = await this.prisma.usuarios.update({
      where: { id },
      data,
    });

    return {
      id: actualizado.id,
      nombre: actualizado.nombre_completo,
      email: actualizado.correo,
      telefono: actualizado.telefono,
      rol: actualizado.rol as 'admin' | 'staff',
      estaActivo: actualizado.esta_activo,
      fechaRegistro: actualizado.fecha_creacion.toISOString(),
    };
  }

  // Desactiva un perfil de staff (borrado lógico).
  async desactivarStaff(id: string): Promise<{ id: string }> {
    await this.obtenerStaff(id);
    await this.prisma.usuarios.update({
      where: { id },
      data: { esta_activo: false },
    });
    return { id };
  }

  // Busca un usuario con rol 'admin' o 'staff' o lanza 404.
  private async obtenerStaff(id: string) {
    const usuario = await this.prisma.usuarios.findUnique({ where: { id } });
    if (!usuario || (usuario.rol !== 'admin' && usuario.rol !== 'staff')) {
      throw new NotFoundException('Perfil de personal no encontrado.');
    }
    return usuario;
  }
}
