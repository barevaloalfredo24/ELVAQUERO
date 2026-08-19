// =====================================================================
// GUARDIA DE AUTENTICACIÓN (JWT)
// ---------------------------------------------------------------------
// Protege rutas que requieren sesión. Lee el token "Bearer" del header
// Authorization, lo verifica y adjunta el id del usuario a la petición.
// =====================================================================

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

// Interfaz para la petición con el id de usuario adjunto por la guardia.
export interface RequestConUsuario extends Request {
  usuarioId?: string;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwt: JwtService) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const request = contexto.switchToHttp().getRequest<RequestConUsuario>();
    const auth = request.headers.authorization;

    // Se exige el header "Authorization: Bearer <token>".
    if (!auth || !auth.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token no proporcionado.');
    }

    const token = auth.slice(7);
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token);
      request.usuarioId = payload.sub;
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido o expirado.');
    }
  }
}
