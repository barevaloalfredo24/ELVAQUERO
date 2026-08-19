// =====================================================================
// CONTROLADOR DE AUTENTICACIÓN
// ---------------------------------------------------------------------
// Endpoints de registro, inicio de sesión y perfil del usuario actual.
// =====================================================================

import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService, UsuarioDTO } from './auth.service';
import { LoginDto, RegistroDto } from './dto';
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

  // GET /api/auth/me  (protegido)
  @UseGuards(AuthGuard)
  @Get('me')
  async yo(@Req() req: RequestConUsuario): Promise<UsuarioDTO | null> {
    return this.auth.usuarioPorId(req.usuarioId ?? '');
  }
}
