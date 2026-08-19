// =====================================================================
// DECORADOR @Roles
// ---------------------------------------------------------------------
// Marca un endpoint con los roles que pueden acceder a él. Lo consume
// la guardia RolesGuard junto con AuthGuard.
// =====================================================================

import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

// Uso: @Roles('admin') o @Roles('admin', 'staff')
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
