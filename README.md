# Bun Mococa Server

Modern monolith server built with [Bun](https://bun.sh) and [Elysia](https://elysiajs.com).

## Technologies

- **Runtime**: Bun
- **Framework**: Elysia
- **Database**: SQLite with Drizzle ORM
- **Cache**: Redis
- **Payments**: AbacatePay (Pix QR codes)
- **Storage**: S3
- **Authentication**: OAuth2 (Google, GitHub, Discord) + AWS Cognito (optional)
- **Notifications**: Discord bot
- **Infrastructure**: Docker Compose, Cloudflare Tunnel
- **Language**: TypeScript

## 🚀 Get Started

```bash
# Set up environment variables
cp .env.example .env

# Install dependencies
bun install

# Build the application (creates dist/ with all dependencies)
bun run build

# Copy .env to dist directory
cp .env dist/.env

# Start with Docker Compose (Redis, API, Cloudflared)
docker compose up -d

# OR run locally without Docker
bun run start

# Development mode (with auto-reload and Docker services)
bun run dev
```

## Features

### 🔒 Auth

- OAuth2 authentication: Google, GitHub, Discord
- Session management with Redis
- Role-based authorization (Admin, User)
- User status tracking (active, inactive, banned)
- AWS Cognito integration for password-based authentication (optional)
- HTML-based OAuth callback with window.postMessage

### 🌐 HTTP

- Rate limiting pre-configured
- CORS support
- 10-second idle timeout
- Elysia framework: super fast, minimal and type-safe
- OpenAPI documentation

### 💵 Payments

- AbacatePay integration for Brazilian Pix payments
- QR code generation with "Copia e Cola" support
- Automatic payment status polling (every 30 seconds)
- Redis-based payment tracking
- Stripe integration (legacy support)

### 🔔 Notifications

- Notification system for admins through Discord
- Easy extensibility for other notification providers

### 💾 Database

- **SQLite** with Bun's native support
- **Drizzle ORM** for type-safe database queries
- Automatic migration system (`*.up.sql` files)
- Migrations tracked in `_migrations` table
- Text-based IDs using `randomblob(12)`
- Unix timestamp format (integers)

### 🗃️ Media Storage

- S3 for media storage with proper authorization
- Presigned URLs for secure file access

### ⏰ Cron Jobs

- Payment status update (every 30 seconds)
- Runs automatically via `@elysiajs/cron`

### 🌐 Cloudflare Tunnel

- Secure public access without exposing IP
- Token-based authentication
- Runs in Docker Compose with host network mode

## Development Commands

### Database Operations
- **Generate migration**: `bun run db:generate` (creates migration from schema changes)
- **Push schema**: `bun run db:push` (applies schema directly to database)
- **Open Drizzle Studio**: `bun run db:studio` (GUI for database management)
- **Run migrations**: Automatic on startup from `src/db/migrations/*.up.sql`

### Building and Deployment
- **Build**: `bun run build` (creates dist/ with migrations and dependencies)
- **Production run**: `bun run prod` (builds and runs from dist/)
- **Docker Compose**: `docker compose up -d` (starts Redis, API, Cloudflared)
- **Restart services**: `bun run restart` (rebuilds API and restarts Cloudflared)
- **View logs**: `bun run logs` / `bun run logs:redis` / `bun run logs:tunnel`

### Systemd Service
- **Setup daemon**: `bun run setup:daemon` (installs systemd service)
- **Restart via systemd**: `bun run restart:systemd`

## Deployment

### Option 1: Docker Compose (Recommended)

1. Build the application:
   ```bash
   bun run build
   ```

2. Copy environment file to dist:
   ```bash
   cp .env dist/.env
   ```

3. Configure Cloudflare Tunnel token in `dist/.env`:
   ```bash
   CLOUDFLARE_TUNNEL_TOKEN="your-token-here"
   ```

4. Start services:
   ```bash
   docker compose up -d
   ```

### Option 2: Systemd Service

1. Build and setup:
   ```bash
   bun run build
   cp .env dist/.env
   bun run setup:daemon
   ```

2. Start service:
   ```bash
   sudo systemctl start {{project-name}}-api
   ```

3. Check status:
   ```bash
   sudo systemctl status {{project-name}}-api
   ```

## Architecture

The application follows a clean architecture pattern with:

- **Services Layer**: Centralized dependency injection container
- **Handlers**: Route handlers organized by access level (public, private, admin)
- **Middlewares**: Authentication, authorization, and request processing
- **Database**: SQLite with Drizzle ORM and automatic migrations
- **Cron Jobs**: Background tasks for payment polling

### Directory Structure

```
src/
├── main.ts                 # Application entry point
├── config.ts               # Environment validation
├── db/
│   ├── db.ts              # Database factory with migration runner
│   ├── schema.ts          # Drizzle schema definitions
│   └── migrations/        # SQL migration files (*.up.sql)
├── handlers/
│   ├── public/            # Unauthenticated routes
│   ├── private/           # User-authenticated routes
│   └── admin/             # Admin-only routes
├── middlewares/
│   ├── auth.ts            # JWT session authentication
│   └── admin.ts           # Admin role verification
├── services/
│   ├── services.ts        # Dependency injection container
│   ├── auth/              # Authentication services
│   ├── aws/               # S3 and Cognito clients
│   ├── payments/          # Payment integrations
│   ├── notifier/          # Notification system
│   └── enums/             # Shared enumerations
└── crons/
    ├── index.ts           # Cron job registration
    └── update-payment-status.ts  # Payment polling job
```

## Environment Variables

Copy `.env.example` to `.env` and configure the required variables:

### Required
- `ENVIRONMENT` - Environment name (production, staging, development)
- `LISTEN_ADDR` - Server listen address (e.g., `:3333`)
- `BASE_URL` - Base URL for OAuth redirects
- `REDIS_URL` - Redis connection URL
- `OAUTH_REDIRECT_URI_BASE` - OAuth callback base path

### Optional
- `MIGRATIONS_DIR` - Custom migrations directory (defaults to `db/migrations`)
- `CLOUDFLARE_TUNNEL_TOKEN` - Cloudflare Tunnel authentication token
- `ABACATE_API_KEY` - AbacatePay API key for payments
- OAuth credentials (at least one provider required)
- AWS credentials (S3, Cognito)
- Discord bot credentials

The application validates required environment variables on startup and exits with an error if any are missing.