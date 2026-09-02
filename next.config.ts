// =====================================================================
// CONFIGURACIÓN DE NEXT.JS
// ---------------------------------------------------------------------
// output: "standalone" genera una carpeta autocontenida (.next/standalone)
// con un server.js mínimo, ideal para empaquetar en Docker con una imagen
// mucho más pequeña.
// =====================================================================

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* No incluyas output: "standalone" para Vercel */
  outputFileTracingExcludes: {
    '*': ['./backend/**/*'],
  },
};

export default nextConfig;