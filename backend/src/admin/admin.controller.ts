// =====================================================================
// CONTROLADOR DE ADMINISTRACIÓN
// ---------------------------------------------------------------------
// Endpoints del panel admin (bajo el prefijo global /api).
// En producción estos endpoints deben protegerse con un guard de rol.
// =====================================================================

import { Controller, Get, Post, Query } from '@nestjs/common';
import { ProductoDTO } from '../catalogo/catalogo.service';
import { UsuarioDTO } from '../auth/auth.service';
import { AdminService, EstadisticasAdminDTO } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  // GET /api/admin/estadisticas
  @Get('estadisticas')
  estadisticas(): Promise<EstadisticasAdminDTO> {
    return this.admin.obtenerEstadisticas();
  }

  // GET /api/admin/notificaciones
  @Get('notificaciones')
  notificaciones() {
    return this.admin.listarNotificaciones();
  }

  // POST /api/admin/notificaciones/leer
  @Post('notificaciones/leer')
  marcarLeidas() {
    return this.admin.marcarNotificacionesLeidas();
  }

  // GET /api/admin/pedidos?estado=
  @Get('pedidos')
  pedidos(@Query('estado') estado?: string) {
    return this.admin.listarPedidos(estado);
  }

  // GET /api/admin/clientes
  @Get('clientes')
  clientes(): Promise<UsuarioDTO[]> {
    return this.admin.listarClientes();
  }

  // GET /api/admin/staff
  @Get('staff')
  staff() {
    return this.admin.listarStaff();
  }

  // GET /api/admin/cupones
  @Get('cupones')
  cupones() {
    return this.admin.listarCupones();
  }

  // GET /api/admin/alertas-stock
  @Get('alertas-stock')
  alertasStock(): Promise<ProductoDTO[]> {
    return this.admin.listarAlertasStock();
  }

  // GET /api/admin/productos
  @Get('productos')
  productos(): Promise<ProductoDTO[]> {
    return this.admin.listarProductos();
  }
}
