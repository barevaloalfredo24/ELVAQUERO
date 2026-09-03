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

  constructor(private readonly config: ConfigService) {
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
      const { data, error } = await this.resend.emails.send({
        from: this.config.get<string>('EMAIL_FROM') ?? 'El Vaquero <ventas@curiosidadeselvaquero.online>',
        to: [destinatario],
        subject: asunto,
        html,
      });

      if (error) {
        console.error('[Resend Error]:', error); // Registra el error devuelto por Resend
        return false;
      }

      return true;
    } catch (err) {
      console.error('[Resend Exception]:', err); //  Registra si ocurre un crash inesperado
      return false;
    }
  }
}
