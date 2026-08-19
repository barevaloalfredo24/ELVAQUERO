// =====================================================================
// DATOS DE PRUEBA: CATEGORÍAS
// ---------------------------------------------------------------------
// Estos datos simulan la tabla "categorias" de la base de datos.
// Cuando exista backend, serán reemplazados por llamadas a la API.
// =====================================================================

import type { Categoria } from "../tipos";

export const categorias: Categoria[] = [
  {
    id: "cat-botas",
    nombre: "Botas",
    slug: "botas",
    descripcion: "Botas vaqueras de cuero para trabajo y ocasiones especiales.",
    icono: "👢",
  },
  {
    id: "cat-sombreros",
    nombre: "Sombreros",
    slug: "sombreros",
    descripcion: "Sombreros de fieltro y palma con estilo del oeste.",
    icono: "🤠",
  },
  {
    id: "cat-cinturones",
    nombre: "Cinturones",
    slug: "cinturones",
    descripcion: "Cinturones de cuero con hebillas grabadas a mano.",
    icono: "🐂",
  },
  {
    id: "cat-camisas",
    nombre: "Camisas",
    slug: "camisas",
    descripcion: "Camisas vaqueras de botón, cuadros y manga larga.",
    icono: "👔",
  },
  {
    id: "cat-pantalones",
    nombre: "Pantalones",
    slug: "pantalones",
    descripcion: "Jeans y pantalones de mezclilla resistentes.",
    icono: "👖",
  },
  {
    id: "cat-accesorios",
    nombre: "Accesorios",
    slug: "accesorios",
    descripcion: "Pañuelos, espuelas, hebillas y más complementos.",
    icono: "🧤",
  },
];
