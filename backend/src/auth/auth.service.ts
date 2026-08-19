// =====================================================================
// SERVICIO DE AUTENTICACIÓN (contra el esquema real)
// ---------------------------------------------------------------------
// Registro e inicio de sesión con email/contraseña, firma de tokens JWT
// y recuperación del usuario. Determina el método de registro (correo vs
// Google) a partir de la tabla cuentas_oauth.
// =====================================================================

import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegistroDto } from './dto';

// Forma del usuario que se devuelve al cliente (sin datos sensibles).
export interface UsuarioDTO {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  verificado: boolean;
  metodoRegistro: 'correo' | 'google';
  telefono: string | null;
  direccion?: string;
  fechaRegistro: string;
}

type UsuarioModelo = Prisma.usuariosGetPayload<Record<string, never>>;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  // Convierte un registro de Prisma a un DTO sin exponer el hash.
  private async aUsuarioDTO(u: UsuarioModelo): Promise<UsuarioDTO> {
    // Determina método de registro y dirección predeterminada en paralelo.
    const [oauth, direccion] = await Promise.all([
      this.prisma.cuentas_oauth.findFirst({ where: { usuario_id: u.id } }),
      this.prisma.direcciones.findFirst({
        where: { usuario_id: u.id, es_predeterminada: true },
      }),
    ]);

    return {
      id: u.id,
      nombre: u.nombre_completo,
      email: u.correo,
      rol: u.rol,
      verificado: u.correo_verificado,
      metodoRegistro: oauth ? 'google' : 'correo',
      telefono: u.telefono,
      direccion: direccion
        ? `${direccion.calle}, ${direccion.ciudad}`
        : undefined,
      fechaRegistro: u.fecha_creacion.toISOString(),
    };
  }

  // Genera un token JWT firmado para un usuario.
  private firmarToken(usuarioId: string): string {
    return this.jwt.sign({ sub: usuarioId });
  }

  // Registra un usuario nuevo (queda SIN verificar hasta confirmar correo).
  async registrar(
    dto: RegistroDto,
  ): Promise<{ token: string; usuario: UsuarioDTO }> {
    const email = dto.email.trim().toLowerCase();
    const existente = await this.prisma.usuarios.findUnique({
      where: { correo: email },
    });
    if (existente) {
      throw new ConflictException('Ya existe una cuenta con ese correo.');
    }

    const contrasenaHash = await bcrypt.hash(dto.password, 10);
    const usuario = await this.prisma.usuarios.create({
      data: {
        nombre_completo: dto.nombre.trim(),
        correo: email,
        contrasena_hash: contrasenaHash,
        rol: 'cliente',
        correo_verificado: false,
      },
    });

    return {
      token: this.firmarToken(usuario.id),
      usuario: await this.aUsuarioDTO(usuario),
    };
  }

  // Inicia sesión validando email y contraseña.
  async login(dto: LoginDto): Promise<{ token: string; usuario: UsuarioDTO }> {
    const email = dto.email.trim().toLowerCase();
    const usuario = await this.prisma.usuarios.findUnique({
      where: { correo: email },
    });

    // Si no existe o no tiene contraseña (registrado con Google), falla.
    if (!usuario || !usuario.contrasena_hash) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }
    const valida = await bcrypt.compare(dto.password, usuario.contrasena_hash);
    if (!valida) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }
    if (!usuario.esta_activo) {
      throw new UnauthorizedException('La cuenta está desactivada.');
    }

    return {
      token: this.firmarToken(usuario.id),
      usuario: await this.aUsuarioDTO(usuario),
    };
  }

  // Devuelve el usuario correspondiente a un id (para GET /auth/me).
  async usuarioPorId(id: string): Promise<UsuarioDTO | null> {
    const usuario = await this.prisma.usuarios.findUnique({ where: { id } });
    return usuario ? this.aUsuarioDTO(usuario) : null;
  }
}
