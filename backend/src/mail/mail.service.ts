// =====================================================================
// SERVICIO DE CORREO (Resend)
// ---------------------------------------------------------------------
// Envía correos transaccionales (recuperación de contraseña, etc.) con
// Resend. Si no hay API key configurada, no envía y devuelve false para
// que el flujo pueda usar el respaldo (código mostrado en desarrollo).
// =====================================================================

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend: Resend | null;

  constructor(config: ConfigService) {
    const apiKey = config.get<string>('RESEND_API_KEY');
    this.resend = apiKey ? new Resend(apiKey) : null;
  }

  // Envía un correo. Devuelve true si se envió correctamente.
  async enviar(
    destinatario: string,
    asunto: string,
    html: string,
  ): Promise<boolean> {
    if (!this.resend) return false;
    try {
      const { error } = await this.resend.emails.send({
        from: process.env.EMAIL_FROM ?? 'El Vaquero <onboarding@resend.dev>',
        to: [destinatario],
        subject: asunto,
        html,
      });
      return !error;
    } catch {
      return false;
    }
  }
}
