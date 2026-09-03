// =====================================================================
// DTOs DE AUTENTICACIÓN (con validación)
// ---------------------------------------------------------------------
// Se usan junto con el ValidationPipe global para validar la entrada.
// =====================================================================

import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

// Datos para crear una cuenta nueva.
export class RegistroDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  nombre!: string;

  @IsEmail({}, { message: 'El correo no es válido.' })
  email!: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
  password!: string;
}

// Datos para iniciar sesión.
export class LoginDto {
  @IsEmail({}, { message: 'El correo no es válido.' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  password!: string;
}

// Token de Google (ID token) enviado desde el cliente.
export class GoogleLoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Credencial de Google no proporcionada.' })
  credential!: string;
}

// Solicitud de recuperación de contraseña.
export class OlvidarContrasenaDto {
  @IsEmail({}, { message: 'El correo no es válido.' })
  email!: string;
}

// Restablecimiento de contraseña con código.
export class RestablecerContrasenaDto {
  @IsEmail({}, { message: 'El correo no es válido.' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'El código es obligatorio.' })
  codigo!: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
  nuevaContrasena!: string;
}
