// =====================================================================
// DATOS DE PRUEBA: USUARIOS
// ---------------------------------------------------------------------
// Simulan la tabla "usuarios". Incluye un administrador y varios
// clientes con distinto estado de verificación y método de registro,
// para poder probar los filtros del panel de clientes.
// =====================================================================

import type { Usuario } from "@/lib/tipos";

export const usuarios: Usuario[] = [
  {
    id: "u-admin",
    nombre: "Administrador El Vaquero",
    email: "admin@elvaquero.com",
    rol: "admin",
    verificado: true,
    metodoRegistro: "correo",
    telefono: "+502 5555 0001",
    fechaRegistro: "2025-01-10T08:00:00.000Z",
  },
  {
    id: "u-1",
    nombre: "Carlos Herrera",
    email: "carlos.herrera@example.com",
    rol: "cliente",
    verificado: true,
    metodoRegistro: "correo",
    telefono: "+502 5555 1010",
    direccion: "Zona 1, Ciudad de Guatemala",
    fechaRegistro: "2026-01-15T10:20:00.000Z",
  },
  {
    id: "u-2",
    nombre: "María López",
    email: "maria.lopez@example.com",
    rol: "cliente",
    verificado: true,
    metodoRegistro: "google",
    telefono: "+502 5555 2020",
    direccion: "Antigua Guatemala, Sacatepéquez",
    fechaRegistro: "2026-02-03T14:00:00.000Z",
  },
  {
    id: "u-3",
    nombre: "José Ramírez",
    email: "jose.ramirez@example.com",
    rol: "cliente",
    verificado: false,
    metodoRegistro: "correo",
    telefono: "+502 5555 3030",
    fechaRegistro: "2026-03-12T09:45:00.000Z",
  },
  {
    id: "u-4",
    nombre: "Ana Morales",
    email: "ana.morales@example.com",
    rol: "cliente",
    verificado: true,
    metodoRegistro: "google",
    telefono: "+502 5555 4040",
    direccion: "Quetzaltenango",
    fechaRegistro: "2026-04-01T11:30:00.000Z",
  },
  {
    id: "u-5",
    nombre: "Luis González",
    email: "luis.gonzalez@example.com",
    rol: "cliente",
    verificado: false,
    metodoRegistro: "correo",
    fechaRegistro: "2026-05-20T16:10:00.000Z",
  },
];
