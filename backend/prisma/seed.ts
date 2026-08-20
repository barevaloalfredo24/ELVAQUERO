// =====================================================================
// SEED DE DATOS DE EJEMPLO
// ---------------------------------------------------------------------
// Inserta en la base de datos (Supabase) las categorías, productos,
// usuarios (incluido un admin) y pedidos de prueba. Reutiliza los datos
// de ejemplo del frontend (src/lib/datos) para mantener coherencia.
//
// Ejecutar con:  npm run db:seed
//
// Credenciales de prueba:
//   - Admin:  admin@elvaquero.com / admin123
//   - Cliente: carlos.herrera@example.com / 123456
// =====================================================================

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { categorias, ordenes, productos, usuarios } from '../../src/lib/datos';

const prisma = new PrismaClient();

// Mapas que relacionan los ids "legibles" del mock con los UUID generados.
const mapaCategorias = new Map<string, string>();
const mapaUsuarios = new Map<string, string>();
const mapaProductos = new Map<
  string,
  { uuid: string; variantes: { uuid: string; talla: string; color: string; sku: string }[] }
>();

// Genera un SKU único y sin caracteres problemáticos.
function generarSku(slug: string, talla: string, color: string): string {
  return `${slug}-${talla}-${color}`
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100);
}

// Traduce el estado del mock al enum de la base de datos.
function estadoASeed(
  estado: string,
): 'pendiente' | 'pagado' | 'enviado' | 'entregado' | 'cancelado' {
  switch (estado) {
    case 'pagada':
      return 'pagado';
    case 'enviada':
      return 'enviado';
    case 'entregada':
      return 'entregado';
    case 'cancelada':
      return 'cancelado';
    default:
      return 'pendiente';
  }
}

// Elimina los datos existentes en orden de dependencias.
async function limpiar() {
  await prisma.notificaciones_admin.deleteMany();
  await prisma.alertas_stock.deleteMany();
  await prisma.vistas_producto.deleteMany();
  await prisma.listas_deseos.deleteMany();
  await prisma.resenas.deleteMany();
  await prisma.pagos.deleteMany();
  await prisma.redenciones_cupon.deleteMany();
  await prisma.historial_estados_orden.deleteMany();
  await prisma.items_orden.deleteMany();
  await prisma.items_carrito.deleteMany();
  await prisma.carritos.deleteMany();
  await prisma.imagenes_producto.deleteMany();
  await prisma.variantes_producto.deleteMany();
  await prisma.productos.deleteMany();
  await prisma.categorias.deleteMany();
  await prisma.direcciones.deleteMany();
  await prisma.verificaciones_correo.deleteMany();
  await prisma.cuentas_oauth.deleteMany();
  await prisma.ordenes.deleteMany();
  await prisma.cupones.deleteMany();
  await prisma.usuarios.deleteMany();
}

async function main() {
  console.log('Limpiando datos existentes...');
  await limpiar();

  // ---- 1. Categorías ----
  console.log('Insertando categorías...');
  for (const c of categorias) {
    const id = randomUUID();
    mapaCategorias.set(c.id, id);
    await prisma.categorias.create({
      data: { id, nombre: c.nombre, slug: c.slug },
    });
  }

  // ---- 2. Productos y variantes ----
  console.log('Insertando productos y variantes...');
  for (const p of productos) {
    const id = randomUUID();
    const categoriaId = mapaCategorias.get(p.categoriaId) ?? null;
    await prisma.productos.create({
      data: {
        id,
        categoria_id: categoriaId,
        nombre: p.nombre,
        slug: p.slug,
        descripcion: p.descripcion,
        precio_base: p.precio,
        esta_activo: p.disponible,
      },
    });

    const variantes: { uuid: string; talla: string; color: string; sku: string }[] = [];
    for (const v of p.variantes) {
      const vid = randomUUID();
      const sku = generarSku(p.slug, v.talla, v.color);
      await prisma.variantes_producto.create({
        data: {
          id: vid,
          producto_id: id,
          sku,
          atributos: { talla: v.talla, color: v.color },
          precio_alternativo: v.precio !== p.precio ? v.precio : null,
          cantidad_stock: v.stock,
          umbral_stock_bajo: p.umbralStock,
          esta_activo: true,
        },
      });
      variantes.push({ uuid: vid, talla: v.talla, color: v.color, sku });
    }
    mapaProductos.set(p.id, { uuid: id, variantes });
  }

  // ---- 3. Usuarios ----
  console.log('Insertando usuarios...');
  const hashCliente = await bcrypt.hash('123456', 10);
  const hashAdmin = await bcrypt.hash('admin123', 10);
  const clientesIds: string[] = [];

  for (const u of usuarios) {
    const id = randomUUID();
    mapaUsuarios.set(u.id, id);
    const esAdmin = u.rol === 'admin';

    await prisma.usuarios.create({
      data: {
        id,
        nombre_completo: u.nombre,
        correo: u.email,
        contrasena_hash: esAdmin ? hashAdmin : hashCliente,
        telefono: u.telefono ?? null,
        rol: esAdmin ? 'admin' : 'cliente',
        correo_verificado: u.verificado,
        esta_activo: true,
      },
    });

    if (!esAdmin) clientesIds.push(id);

    // Cuenta OAuth para quienes se registraron con Google.
    if (u.metodoRegistro === 'google') {
      await prisma.cuentas_oauth.create({
        data: { usuario_id: id, proveedor: 'google', id_proveedor_usuario: `google-${u.email}` },
      });
    }

    // Dirección predeterminada si el mock la tiene.
    if (u.direccion) {
      await prisma.direcciones.create({
        data: {
          usuario_id: id,
          calle: u.direccion,
          ciudad: 'Guatemala',
          pais: 'Guatemala',
          es_predeterminada: true,
        },
      });
    }
  }

  // ---- 4. Reseñas (para poblar las calificaciones del catálogo) ----
  console.log('Insertando reseñas...');
  const reseñas: { producto_id: string; usuario_id: string; calificacion: number; comentario: string; esta_aprobada: boolean }[] = [];
  productos.forEach((p, pi) => {
    const base = Math.round(p.calificacion);
    const ratings = [Math.min(5, base + 1), base, Math.max(1, base - 1)];
    ratings.forEach((r, ri) => {
      const usuarioId = clientesIds[(pi * 3 + ri) % clientesIds.length];
      reseñas.push({
        producto_id: mapaProductos.get(p.id)!.uuid,
        usuario_id: usuarioId,
        calificacion: r,
        comentario: 'Excelente calidad, muy recomendado.',
        esta_aprobada: true,
      });
    });
  });
  await prisma.resenas.createMany({ data: reseñas });

  // ---- 5. Órdenes de prueba ----
  console.log('Insertando órdenes...');
  for (const o of ordenes) {
    const usuarioId = mapaUsuarios.get(o.clienteId);
    if (!usuarioId) continue;

    // Dirección de envío de la orden.
    const direccion = await prisma.direcciones.create({
      data: { usuario_id: usuarioId, calle: o.direccionEnvio, ciudad: 'Guatemala', pais: 'Guatemala' },
    });

    const estado = estadoASeed(o.estado);

    // Resuelve cada línea a su variante (por talla/color del texto "Talla X · Color").
    const lineas = o.items.map((it) => {
      const prod = mapaProductos.get(it.productoId);
      const m = /Talla (.+?) · (.+)/.exec(it.variante);
      const variante =
        prod?.variantes.find((v) => v.talla === m?.[1] && v.color === m?.[2]) ??
        prod?.variantes[0];
      return {
        variante_id: variante!.uuid,
        nombre_producto_snapshot: it.nombre,
        sku_snapshot: variante!.sku,
        precio_unitario: it.precioUnitario,
        cantidad: it.cantidad,
        subtotal: it.subtotal,
      };
    });

    await prisma.ordenes.create({
      data: {
        numero_orden: o.id,
        usuario_id: usuarioId,
        estado,
        metodo_pago: o.metodoPago,
        direccion_envio_id: direccion.id,
        subtotal: o.subtotal,
        descuento_total: 0,
        envio_total: o.envio,
        impuestos_total: 0,
        total: o.total,
        fecha_creacion: new Date(o.fecha),
        items_orden: { create: lineas },
        pagos: { create: { metodo: o.metodoPago, estado: 'pendiente', monto: o.total } },
      },
    });
  }

  console.log('Seed completado correctamente.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
