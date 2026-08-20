// =====================================================================
// CONTROLADOR DE AUTENTICACIÓN
// ---------------------------------------------------------------------
// Endpoints de registro, inicio de sesión y perfil del usuario actual.
// =====================================================================

import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService, UsuarioDTO } from './auth.service';
import {
  GoogleLoginDto,
  LoginDto,
  OlvidarContrasenaDto,
  RegistroDto,
  RestablecerContrasenaDto,
} from './dto';
import { AuthGuard } from './auth.guard';
import type { RequestConUsuario } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // POST /api/auth/registro
  @Post('registro')
  registrar(
    @Body() dto: RegistroDto,
  ): Promise<{ token: string; usuario: UsuarioDTO }> {
    return this.auth.registrar(dto);
  }

  // POST /api/auth/login
  @Post('login')
  login(
    @Body() dto: LoginDto,
  ): Promise<{ token: string; usuario: UsuarioDTO }> {
    return this.auth.login(dto);
  }

  // POST /api/auth/google  (login/registro con cuenta de Google)
  @Post('google')
  loginGoogle(
    @Body() dto: GoogleLoginDto,
  ): Promise<{ token: string; usuario: UsuarioDTO }> {
    return this.auth.loginGoogle(dto);
  }

  // POST /api/auth/olvidar-contrasena  (solicita código de recuperación)
  @Post('olvidar-contrasena')
  olvidarContrasena(@Body() dto: OlvidarContrasenaDto) {
    return this.auth.olvidarContrasena(dto);
  }

  // POST /api/auth/restablecer-contrasena  (restablece con código)
  @Post('restablecer-contrasena')
  restablecerContrasena(@Body() dto: RestablecerContrasenaDto) {
    return this.auth.restablecerContrasena(dto);
  }

  // GET /api/auth/me  (protegido)
  @UseGuards(AuthGuard)
  @Get('me')
  async yo(@Req() req: RequestConUsuario): Promise<UsuarioDTO | null> {
    return this.auth.usuarioPorId(req.usuarioId ?? '');
  }
}
