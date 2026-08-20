// =====================================================================
// SERVICIO DE PAGOS (Recurrente)
// ---------------------------------------------------------------------
// Crea el checkout embebido de Recurrente, confirma el pago consultando
// la API (server-to-server) y procesa el webhook con verificación de
// firma (Svix). El estado de la orden se marca "pagado" solo cuando el
// pago está confirmado.
// =====================================================================

import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Webhook } from 'svix';
import { PrismaService } from '../prisma/prisma.service';
import { OrdenesService } from '../ordenes/ordenes.service';
import { CrearOrdenDto } from '../ordenes/dto';

const BASE_URL = 'https://app.recurrente.com/api';
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000';

// Forma de la respuesta de la API de Recurrente (checkout / error).
interface RecurrenteResponse {
  id?: string;
  status?: string;
  checkout_url?: string;
  error?: { message?: string };
  message?: string;
}

@Injectable()
export class PagosService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private ordenes: OrdenesService,
  ) {}

  private get secretKey(): string {
    return this.config.get<string>('RECURRENTE_SECRET_KEY') ?? '';
  }

  // Crea la orden y el checkout de Recurrente para pago con tarjeta.
  async crearCheckoutRecurrente(dto: CrearOrdenDto, usuarioId: string) {
    // 1) Crea la orden (método tarjeta → estado pendiente + pago pendiente).
    const orden = await this.ordenes.crearOrden(usuarioId, {
      ...dto,
      metodoPago: 'tarjeta',
    });

    // 2) Crea el checkout en Recurrente (monto total en centavos).
    const totalCentavos = Math.round(orden.total * 100);
    const respuesta = await fetch(`${BASE_URL}/checkouts`, {
      method: 'POST',
      headers: {
        'X-SECRET-KEY': this.secretKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            name: `Pedido ${orden.id}`,
            amount_in_cents: totalCentavos,
            currency: 'GTQ',
            quantity: 1,
            charge_type: 'one_time',
            payment_method_types: ['card'],
            available_installments: [],
          },
        ],
        success_url: `${FRONTEND_URL}/gracias?orden=${orden.id}`,
        cancel_url: `${FRONTEND_URL}/checkout`,
      }),
    });
    const data = (await respuesta.json()) as unknown as RecurrenteResponse;

    if (!respuesta.ok) {
      throw new BadRequestException(
        data.error?.message ??
          data.message ??
          'No se pudo crear el pago con Recurrente.',
      );
    }

    const checkoutId: string = data.id ?? '';
    const checkoutUrl: string = data.checkout_url ?? '';

    // 3) Guarda la referencia del checkout en el registro de pago.
    const ordenDb = await this.prisma.ordenes.findUnique({
      where: { numero_orden: orden.id },
    });
    if (ordenDb) {
      await this.prisma.pagos.updateMany({
        where: { orden_id: ordenDb.id },
        data: { id_intento_pago_stripe: checkoutId },
      });
    }

    return { ordenId: orden.id, checkoutUrl, orden };
  }

  // Confirma el pago consultando el estado del checkout (server-to-server).
  async confirmarPago(ordenId: string) {
    const pago = await this.obtenerPagoPorOrden(ordenId);
    if (!pago)
      throw new NotFoundException('No hay un pago pendiente para esta orden.');

    const respuesta = await fetch(
      `${BASE_URL}/checkouts/${pago.id_intento_pago_stripe}`,
      {
        headers: { 'X-SECRET-KEY': this.secretKey },
      },
    );
    const data = (await respuesta.json()) as unknown as RecurrenteResponse;

    if (respuesta.ok && data.status === 'paid') {
      await this.marcarPagado(pago.orden_id, pago.id_intento_pago_stripe!);
      return { pagado: true };
    }

    return { pagado: false, status: data.status ?? 'desconocido' };
  }

  // Procesa el webhook de Recurrente (verifica la firma con Svix).
  async manejarWebhook(rawBody: Buffer, headers: Record<string, string>) {
    const signingSecret =
      this.config.get<string>('RECURRENTE_SIGNING_SECRET') ?? '';

    let payload: Record<string, unknown>;
    try {
      const wh = new Webhook(signingSecret);
      payload = wh.verify(rawBody, headers) as Record<string, unknown>;
    } catch {
      throw new UnauthorizedException('Firma de webhook inválida.');
    }

    const eventType = payload.event_type;
    const status = payload.status;
    const checkout = payload.checkout as { id?: string } | undefined;

    if (
      eventType === 'intent.succeeded' &&
      status === 'succeeded' &&
      checkout?.id
    ) {
      const pago = await this.prisma.pagos.findFirst({
        where: { id_intento_pago_stripe: checkout.id },
      });
      if (pago && pago.estado !== 'exitoso') {
        await this.marcarPagado(pago.orden_id, checkout.id);
      }
    }

    return { recibido: true };
  }

  // Marca el pago como exitoso y la orden como pagada (idempotente).
  private async marcarPagado(ordenId: string, referencia: string) {
    await this.prisma.$transaction([
      this.prisma.pagos.updateMany({
        where: { orden_id: ordenId, id_intento_pago_stripe: referencia },
        data: { estado: 'exitoso', fecha_pago: new Date() },
      }),
      this.prisma.ordenes.updateMany({
        where: { id: ordenId, estado: { not: 'pagado' } },
        data: { estado: 'pagado' },
      }),
    ]);

    await this.prisma.historial_estados_orden.create({
      data: { orden_id: ordenId, estado: 'pagado' },
    });
  }

  // Busca el pago pendiente de una orden (por numero_orden).
  private async obtenerPagoPorOrden(numeroOrden: string) {
    const orden = await this.prisma.ordenes.findUnique({
      where: { numero_orden: numeroOrden },
    });
    if (!orden) return null;
    return this.prisma.pagos.findFirst({
      where: { orden_id: orden.id, id_intento_pago_stripe: { not: null } },
    });
  }
}
