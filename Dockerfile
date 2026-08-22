# =====================================================================
# DOCKERFILE - FRONTEND (Next.js)
# ---------------------------------------------------------------------
# Build multi-etapa con output "standalone" para una imagen final mínima.
# NEXT_PUBLIC_API_URL se define en build (vacía => el cliente usa rutas
# relativas /api, resueltas por nginx en producción).
# =====================================================================

# ---- 1) Dependencias ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- 2) Build ----
FROM node:20-alpine AS build
WORKDIR /app
# NEXT_PUBLIC_API_URL se inyecta en build time (vacía por defecto).
ARG NEXT_PUBLIC_API_URL=""
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
# Client ID de Google OAuth (público, se embebe en el cliente).
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID=""
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- 3) Runner ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

# Copia solo el resultado standalone + estáticos + public.
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
