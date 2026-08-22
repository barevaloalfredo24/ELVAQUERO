# El Vaquero — E-commerce

Tienda en línea con catálogo de productos, carrito, checkout, autenticación
(registro/login con Google), panel de administración y pagos.

## Stack

| Componente | Tecnología |
|---|---|
| Frontend | Next.js 16 (App Router, React 19, Tailwind CSS v4) |
| Backend | NestJS 11 (REST API bajo el prefijo `/api`) |
| ORM / DB | Prisma 6 + PostgreSQL (Supabase) |
| Servicios externos | Cloudinary, Resend, Recurrente, Google OAuth |

## Estructura

```
.
├── app/                    # Frontend Next.js (páginas y componentes)
├── src/lib/                # Cliente HTTP, contexto de autenticación, etc.
├── backend/                # Backend NestJS (carpeta independiente)
├── Dockerfile              # Imagen del frontend (Next.js standalone)
├── backend/Dockerfile      # Imagen del backend (NestJS + Prisma)
├── nginx.conf              # Reverse proxy (un solo origen)
└── docker-compose.yml      # Orquestación: nginx + frontend + backend
```

## Despliegue con Docker (producción)

### 1. Requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (o Docker Engine + Compose).
- Credenciales en `backend/.env` (ver sección *Configuración*).
- Proyecto de Supabase **activo** (la base de datos es externa y debe ser
  alcanzable desde tu red).

### 2. Configuración

Copia `backend/.env.example` a `backend/.env` y completa los valores:

```env
# Base de datos (usa la URL de tu proyecto Supabase).
DATABASE_URL="postgresql://postgres:TU_PASSWORD@TU_HOST:5432/postgres"

# Secreto para firmar los tokens JWT.
JWT_SECRET="un-secreto-largo-y-aleatorio"

# Cloudinary (imágenes), Resend (correos), Recurrente (pagos), Google (OAuth).
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
GOOGLE_CLIENT_ID="..."
RESEND_API_KEY="..."
EMAIL_FROM="El Vaquero <onboarding@resend.dev>"
RECURRENTE_SECRET_KEY="..."
RECURRENTE_SIGNING_SECRET="..."
```

> `backend/.env` contiene secretos y **no** se sube al repositorio.

### 3. Levantar la aplicación

```bash
docker compose up -d --build
```

La primera compilación descarga dependencias y tarda unos minutos.

### 4. Acceder

Abre <http://localhost> (puerto **80** por defecto).

Para usar otro puerto:

```bash
HTTP_PORT=8081 docker compose up -d --build
# PowerShell:
# $env:HTTP_PORT="8081"; docker compose up -d --build
```

### 5. Ver estado y logs

```bash
docker compose ps          # estado + healthchecks
docker compose logs -f     # logs de todos los servicios
docker compose logs -f backend
```

### 6. Detener / limpiar

```bash
docker compose down            # detiene y elimina contenedores (conserva imágenes)
docker compose down -v         # igual, y elimina volúmenes
```

## Servicios y puertos

| Servicio | Imagen | Puerto interno | Puerto público |
|---|---|---|---|
| `nginx` | `nginx:alpine` | 80 | `${HTTP_PORT:-80}` |
| `frontend` | build local (`Dockerfile`) | 3000 | — (solo interno) |
| `backend` | build local (`backend/Dockerfile`) | 4000 | — (solo interno) |

nginx enruta:
- `/` → frontend (Next.js)
- `/api/*` → backend (NestJS)

De esta forma el navegador usa rutas relativas `/api` y no hay CORS ni URLs
hardcodeadas.

## Desarrollo local (sin Docker)

Frontend (desde la raíz):

```bash
npm install
npm run dev      # http://localhost:3000
```

Backend (desde `backend/`):

```bash
npm install
npx prisma generate
npm run start:dev   # http://localhost:4000/api
```

En desarrollo, configura en `.env.local` (raíz) la URL del backend:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
```

## Verificación (CI / calidad)

```bash
# Frontend
npm run lint
npm run build

# Backend
cd backend
npm run lint
npm run build
```

## Notas

- **Supabase**: la base de datos es externa. Si el proyecto está pausado o no es
  alcanzable, el backend se reinicia en bucle (`docker compose ps` muestra
  `Restarting`) y el frontend funciona igualmente con datos de respaldo.
- **Healthchecks**: cada servicio tiene un healthcheck; cuando el backend no
  puede conectar a la base de datos, su estado es `unhealthy` hasta recuperar la
  conexión.
- Las imágenes finales usan `output: "standalone"` (frontend) y solo
  dependencias de producción (backend), con usuario no privilegiado.
