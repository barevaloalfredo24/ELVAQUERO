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
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { randomInt } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import {
  GoogleLoginDto,
  LoginDto,
  OlvidarContrasenaDto,
  RegistroDto,
  RestablecerContrasenaDto,
} from './dto';

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
  // Cliente para verificar los ID tokens de Google.
  private google: OAuth2Client;

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private mail: MailService,
  ) {
    this.google = new OAuth2Client(this.config.get<string>('GOOGLE_CLIENT_ID'));
  }

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
  ): Promise<{
    token: string;
    usuario: UsuarioDTO;
    requiereVerificacion: boolean;
    codigoDev?: string;
  }> {
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

    // Genera un código de verificación de 6 dígitos (válido 15 min).
    const codigo = String(randomInt(100000, 1000000));
    const expiracion = new Date(Date.now() + 15 * 60 * 1000);
    await this.prisma.verificaciones_correo.create({
      data: {
        usuario_id: usuario.id,
        token: codigo,
        fecha_expiracion: expiracion,
      },
    });

    // Envía el código por correo (Resend); si falla, se registra en consola.
    const enviado = await this.mail.enviar(
      email,
      'Verifica tu correo - Curiosidades El Vaquero',
      `<div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2>Verifica tu correo</h2>
        <p>Tu código de verificación es:</p>
        <p style="font-size:28px;font-weight:bold;letter-spacing:6px">${codigo}</p>
        <p>Este código vence en 15 minutos.</p>
      </div>`,
    );
    if (!enviado) {
      console.log(`[verificar-correo] Código para ${email}: ${codigo}`);
    }

    return {
      token: this.firmarToken(usuario.id),
      usuario: await this.aUsuarioDTO(usuario),
      requiereVerificacion: true,
      codigoDev: enviado ? undefined : codigo,
    };
  }

  // Verifica el correo con el código enviado.
  async verificarCorreo(dto: {
    email: string;
    codigo: string;
  }): Promise<{ ok: boolean }> {
    const email = dto.email.trim().toLowerCase();
    const usuario = await this.prisma.usuarios.findUnique({
      where: { correo: email },
    });
    if (!usuario) {
      throw new UnauthorizedException('Código inválido o expirado.');
    }

    const registro = await this.prisma.verificaciones_correo.findFirst({
      where: {
        usuario_id: usuario.id,
        token: dto.codigo.trim(),
        fecha_verificacion: null,
        fecha_expiracion: { gte: new Date() },
      },
      orderBy: { fecha_creacion: 'desc' },
    });
    if (!registro) {
      throw new UnauthorizedException('Código inválido o expirado.');
    }

    await this.prisma.$transaction([
      this.prisma.usuarios.update({
        where: { id: usuario.id },
        data: { correo_verificado: true },
      }),
      this.prisma.verificaciones_correo.update({
        where: { id: registro.id },
        data: { fecha_verificacion: new Date() },
      }),
    ]);

    return { ok: true };
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
    if (!usuario.correo_verificado) {
      throw new UnauthorizedException(
        'Debes verificar tu correo antes de iniciar sesión.',
      );
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

  // Inicia sesión o registra usando el ID token de Google.
  async loginGoogle(
    dto: GoogleLoginDto,
  ): Promise<{ token: string; usuario: UsuarioDTO }> {
    // Verifica la firma y audiencia del token de Google.
    let payload;
    try {
      const ticket = await this.google.verifyIdToken({
        idToken: dto.credential,
        audience: this.config.get<string>('GOOGLE_CLIENT_ID'),
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Token de Google inválido.');
    }

    const email = payload?.email?.trim().toLowerCase();
    const googleId = payload?.sub;
    if (!email || !googleId) {
      throw new UnauthorizedException(
        'No se pudo obtener la cuenta de Google.',
      );
    }

    // Busca si el usuario ya existe por correo.
    let usuario = await this.prisma.usuarios.findUnique({
      where: { correo: email },
    });

    if (!usuario) {
      // Crea el usuario (correo ya verificado por Google, sin contraseña).
      usuario = await this.prisma.usuarios.create({
        data: {
          nombre_completo: payload?.name ?? email.split('@')[0],
          correo: email,
          contrasena_hash: null,
          rol: 'cliente',
          correo_verificado: true,
        },
      });
    }

    // Vincula la cuenta de Google si no está vinculada aún.
    const vinculada = await this.prisma.cuentas_oauth.findUnique({
      where: {
        proveedor_id_proveedor_usuario: {
          proveedor: 'google',
          id_proveedor_usuario: googleId,
        },
      },
    });
    if (!vinculada) {
      await this.prisma.cuentas_oauth.create({
        data: {
          usuario_id: usuario.id,
          proveedor: 'google',
          id_proveedor_usuario: googleId,
        },
      });
    }

    if (!usuario.esta_activo) {
      throw new UnauthorizedException('La cuenta está desactivada.');
    }

    return {
      token: this.firmarToken(usuario.id),
      usuario: await this.aUsuarioDTO(usuario),
    };
  }

  // Genera un código de recuperación y lo "envía" (dev: se devuelve y registra).
  async olvidarContrasena(
    dto: OlvidarContrasenaDto,
  ): Promise<{ ok: boolean; codigoDev?: string }> {
    const email = dto.email.trim().toLowerCase();
    const usuario = await this.prisma.usuarios.findUnique({
      where: { correo: email },
    });

    // Siempre responde "ok" para no revelar si el correo existe.
    if (!usuario) return { ok: true };

    // Genera un código de 6 dígitos con validez de 15 minutos.
    const codigo = String(randomInt(100000, 1000000));
    const expiracion = new Date(Date.now() + 15 * 60 * 1000);

    // Invalida tokens de recuperación anteriores del usuario.
    await this.prisma.verificaciones_correo.updateMany({
      where: { usuario_id: usuario.id, fecha_verificacion: null },
      data: { fecha_verificacion: new Date() },
    });

    // Guarda el código (reutilizando la tabla verificaciones_correo).
    await this.prisma.verificaciones_correo.create({
      data: {
        usuario_id: usuario.id,
        token: codigo,
        fecha_expiracion: expiracion,
      },
    });

    // Envía el código por correo (Resend). Si no hay proveedor configurado
    // o falla el envío, se devuelve el código para poder probar en desarrollo.
    const enviado = await this.mail.enviar(
      email,
      'Código de recuperación - El Vaquero',
      `<div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2>Recupera tu contraseña</h2>
        <p>Tu código de recuperación es:</p>
        <p style="font-size:28px;font-weight:bold;letter-spacing:6px">${codigo}</p>
        <p>Este código vence en 15 minutos.</p>
      </div>`,
    );

    if (enviado) {
      return { ok: true };
    }

    console.log(`[recuperar-contrasena] Código para ${email}: ${codigo}`);
    return { ok: true, codigoDev: codigo };
  }

  // Restablece la contraseña usando el código de recuperación.
  async restablecerContrasena(
    dto: RestablecerContrasenaDto,
  ): Promise<{ ok: boolean }> {
    const email = dto.email.trim().toLowerCase();
    const usuario = await this.prisma.usuarios.findUnique({
      where: { correo: email },
    });
    if (!usuario) {
      throw new UnauthorizedException('Código inválido o expirado.');
    }

    // Busca un código vigente y no usado.
    const registro = await this.prisma.verificaciones_correo.findFirst({
      where: {
        usuario_id: usuario.id,
        token: dto.codigo.trim(),
        fecha_verificacion: null,
        fecha_expiracion: { gte: new Date() },
      },
      orderBy: { fecha_creacion: 'desc' },
    });
    if (!registro) {
      throw new UnauthorizedException('Código inválido o expirado.');
    }

    // Actualiza la contraseña y marca el código como usado.
    const contrasenaHash = await bcrypt.hash(dto.nuevaContrasena, 10);
    await this.prisma.$transaction([
      this.prisma.usuarios.update({
        where: { id: usuario.id },
        data: { contrasena_hash: contrasenaHash },
      }),
      this.prisma.verificaciones_correo.update({
        where: { id: registro.id },
        data: { fecha_verificacion: new Date() },
      }),
    ]);

    return { ok: true };
  }
}
