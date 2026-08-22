# =====================================================================
# DOCKERFILE - BACKEND (NestJS + Prisma)
# ---------------------------------------------------------------------
# Build multi-etapa. La base de datos es externa (Supabase).
# En la etapa final solo se instalan dependencias de producción
# (npm ci --omit=dev) para reducir el tamaño de la imagen, y se copia
# el cliente Prisma ya generado (incluye el motor de consultas nativo).
# =====================================================================

# ---- 1) Build ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# ---- 2) Runner (solo producción) ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

RUN addgroup -S nodejs && adduser -S nestjs -G nodejs

COPY package.json package-lock.json ./
RUN npm ci --omit=dev \
 && rm -rf node_modules/@prisma/engines \
 && find node_modules/@prisma/client/runtime -name "*.map" -delete \
 && find node_modules/@prisma/client/runtime -name "query_engine_bg.*.wasm-base64.*" ! -name "*postgresql*" -delete \
 && find node_modules/@prisma/client/runtime -name "query_compiler_bg.*.wasm-base64.*" ! -name "*postgresql*" -delete

# Cliente Prisma generado (el postinstall de producción solo deja un stub).
COPY --from=build --chown=nestjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/prisma ./prisma

USER nestjs
EXPOSE 4000

CMD ["node", "dist/main.js"]
