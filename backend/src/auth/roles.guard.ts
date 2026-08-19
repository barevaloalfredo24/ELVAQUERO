// =====================================================================
// GUARDIA DE ROLES
// ---------------------------------------------------------------------
// Se usa después de AuthGuard. Lee los roles permitidos (vía @Roles),
// consulta el rol del usuario en la base de datos y permite o deniega
// el acceso. Lanza ForbiddenException si el rol no está permitido.
// =====================================================================

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { ROLES_KEY } from './roles.decorator';
import type { RequestConUsuario } from './auth.guard';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    // Roles requeridos por el endpoint.
    const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);

    // Si el endpoint no define roles, se permite el paso.
    if (!roles || roles.length === 0) return true;

    const request = contexto.switchToHttp().getRequest<RequestConUsuario>();
    if (!request.usuarioId) {
      throw new UnauthorizedException('No autenticado.');
    }

    const usuario = await this.prisma.usuarios.findUnique({
      where: { id: request.usuarioId },
      select: { rol: true, esta_activo: true },
    });

    if (!usuario || !usuario.esta_activo) {
      throw new UnauthorizedException('Usuario no válido o desactivado.');
    }

    if (!roles.includes(usuario.rol)) {
      throw new ForbiddenException(
        'No tienes permisos para realizar esta acción.',
      );
    }

    return true;
  }
}
