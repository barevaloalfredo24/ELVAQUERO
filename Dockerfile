# =====================================================================
# DOCKERFILE - FRONTEND (Next.js)
# ---------------------------------------------------------------------
# Build multi-etapa: compila con npm run build y corre con `next start`
# en una imagen con solo dependencias de producción.
# NEXT_PUBLIC_* se inyecta en build time.
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

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build --chown=nextjs:nodejs /app/.next ./.next
COPY --from=build --chown=nextjs:nodejs /app/public ./public
COPY --chown=nextjs:nodejs next.config.mjs ./

USER nextjs
EXPOSE 3000

CMD ["node_modules/.bin/next", "start"]
