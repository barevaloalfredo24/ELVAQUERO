// =====================================================================
// SERVICIO DE PEDIDOS (GESTIÓN)
// ---------------------------------------------------------------------
// Asigna el número de seguimiento y la paquetería a una orden, cambia su
// estado a "enviado", registra el cambio en el historial y notifica al
// cliente por correo con un comprobante formal del pedido.
// =====================================================================

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { AsignarSeguimientoDto } from './dto';

// Formatea un valor como moneda (para el correo).
function q(n: unknown): string {
  return `Q ${Number(n ?? 0).toFixed(2)}`;
}

@Injectable()
export class PedidosGestionService {
  constructor(
    private prisma: PrismaService,
    private mail: MailService,
  ) {}

  // Asigna seguimiento a una orden y cambia su estado a "enviado".
  // El id recibido es el "numero_orden" (el frontend lo usa como id).
  async asignarSeguimiento(
    ordenId: string,
    dto: AsignarSeguimientoDto,
    usuarioId: string,
  ) {
    const orden = await this.prisma.ordenes.findUnique({
      where: { numero_orden: ordenId },
      include: {
        usuarios: true,
        items_orden: {
          include: {
            variantes_producto: { select: { atributos: true } },
          },
        },
        direcciones_ordenes_direccion_envio_idTodirecciones: true,
      },
    });
    if (!orden) throw new NotFoundException('Orden no encontrada.');

    const numeroSeguimiento = dto.numeroSeguimiento.trim();
    const paqueteria = dto.paqueteria.trim();

    // Actualiza la orden y registra el cambio de estado en el historial.
    await this.prisma.$transaction(async (tx) => {
      await tx.ordenes.update({
        where: { id: orden.id },
        data: {
          numero_seguimiento: numeroSeguimiento,
          paqueteria,
          estado: 'enviado',
        },
      });
      await tx.historial_estados_orden.create({
        data: {
          orden_id: orden.id,
          estado: 'enviado',
          modificado_por: usuarioId,
          nota: `Seguimiento ${numeroSeguimiento} · ${paqueteria}`,
        },
      });
    });

    // Notifica al cliente con un comprobante formal del pedido.
    const enviado = await this.mail.enviar(
      orden.usuarios.correo,
      `Tu pedido ${orden.numero_orden} ha sido enviado`,
      this.construirCorreoEnvio(orden, paqueteria, numeroSeguimiento),
    );
    void enviado;

    return {
      id: orden.numero_orden,
      numeroSeguimiento,
      paqueteria,
      estado: 'enviado',
    };
  }

  // Construye el correo (comprobante) del envío en HTML.
  private construirCorreoEnvio(
    orden: {
      numero_orden: string;
      fecha_creacion: Date;
      subtotal: unknown;
      descuento_total: unknown;
      envio_total: unknown;
      total: unknown;
      metodo_pago: string;
      usuarios: { nombre_completo: string };
      items_orden: {
        nombre_producto_snapshot: string;
        cantidad: number;
        precio_unitario: unknown;
        subtotal: unknown;
        variantes_producto: { atributos: unknown };
      }[];
      direcciones_ordenes_direccion_envio_idTodirecciones: {
        calle: string;
      } | null;
    },
    paqueteria: string,
    numeroSeguimiento: string,
  ): string {
    const direccion = orden.direcciones_ordenes_direccion_envio_idTodirecciones;
    const metodo =
      orden.metodo_pago === 'tarjeta' ? 'Tarjeta' : 'Contra entrega';
    const fecha = orden.fecha_creacion.toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Filas de la tabla de productos.
    const filas = orden.items_orden
      .map((it) => {
        const at = (it.variantes_producto.atributos ?? {}) as {
          talla?: string;
          color?: string;
        };
        const variante = `Talla ${at.talla ?? ''} · ${at.color ?? ''}`;
        return `<tr style="border-bottom:1px solid #eee;">
          <td style="padding:8px;text-align:left;">${it.nombre_producto_snapshot}<br/><small style="color:#8a6a4f;">${variante}</small></td>
          <td style="padding:8px;text-align:center;">${it.cantidad}</td>
          <td style="padding:8px;text-align:right;">${q(it.precio_unitario)}</td>
          <td style="padding:8px;text-align:right;">${q(it.subtotal)}</td>
        </tr>`;
      })
      .join('');

    const descuento = Number(orden.descuento_total ?? 0);
    const envio = Number(orden.envio_total ?? 0);

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#faf6f0;">
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#3a2a1a;background:#faf6f0;">
      <div style="background:#5c3423;color:#ffffff;padding:22px;text-align:center;">
        <h1 style="margin:0;font-size:22px;">🤠 El Vaquero</h1>
        <p style="margin:6px 0 0;font-size:13px;color:#e4cdb0;">Comprobante de envío</p>
      </div>
      <div style="padding:24px;">
        <h2 style="margin:0 0 12px;color:#5c3423;">¡Tu pedido va en camino! 🚚</h2>
        <p style="margin:0 0 16px;font-size:14px;">Hola <strong>${orden.usuarios.nombre_completo}</strong>, tu pedido <strong>${orden.numero_orden}</strong> ha sido enviado.</p>

        <div style="background:#f2e7d7;border:1px solid #e4cdb0;border-radius:8px;padding:14px;margin-bottom:20px;">
          <p style="margin:4px 0;font-size:14px;"><strong>Paquetería:</strong> ${paqueteria}</p>
          <p style="margin:4px 0;font-size:14px;"><strong>Número de seguimiento:</strong> ${numeroSeguimiento}</p>
        </div>

        <h3 style="margin:0 0 8px;color:#5c3423;">Resumen del pedido</h3>
        <table style="width:100%;border-collapse:collapse;font-size:13px;background:#ffffff;">
          <thead>
            <tr style="background:#e4cdb0;color:#3a2a1a;">
              <th style="padding:8px;text-align:left;">Producto</th>
              <th style="padding:8px;text-align:center;">Cant.</th>
              <th style="padding:8px;text-align:right;">Precio</th>
              <th style="padding:8px;text-align:right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>${filas}</tbody>
        </table>

        <div style="margin-top:14px;font-size:13px;border-top:1px solid #e4cdb0;padding-top:10px;">
          <p style="display:flex;justify-content:space-between;margin:4px 0;"><span>Subtotal</span><span>${q(orden.subtotal)}</span></p>
          ${
            descuento > 0
              ? `<p style="display:flex;justify-content:space-between;margin:4px 0;color:#2e7d32;"><span>Descuento</span><span>− ${q(descuento)}</span></p>`
              : ''
          }
          <p style="display:flex;justify-content:space-between;margin:4px 0;"><span>Envío</span><span>${envio === 0 ? 'Gratis' : q(envio)}</span></p>
          <p style="display:flex;justify-content:space-between;margin:8px 0 0;font-size:16px;font-weight:bold;"><span>Total</span><span>${q(orden.total)}</span></p>
        </div>

        <div style="margin-top:18px;font-size:13px;color:#6b4226;background:#ffffff;border-radius:8px;padding:14px;">
          <p style="margin:4px 0;"><strong>Fecha:</strong> ${fecha}</p>
          <p style="margin:4px 0;"><strong>Método de pago:</strong> ${metodo}</p>
          <p style="margin:4px 0;"><strong>Dirección de envío:</strong> ${direccion ? direccion.calle : '—'}</p>
        </div>

        <p style="margin-top:20px;font-size:13px;color:#6b4226;">Gracias por tu compra en El Vaquero. 🤠</p>
      </div>
      <div style="background:#e4cdb0;color:#5c3423;padding:14px;text-align:center;font-size:11px;">
        El Vaquero · Vestimenta y accesorios vaqueros · ventas@elvaquero.com
      </div>
    </div>
</body>
</html>`;
  }
}
