# Bun Mococa Server

Modern monolith server built with [Bun](https://bun.sh) and [Elysia](https://elysiajs.com).

## Technologies

- Bun
- Elysia
- PostgreSQL
- SQLc
- Redis
- Stripe
- S3
- Cognito
- OAuth2
- Docker
- TypeScript

## 🚀 Get Started

```bash
# Set up environment variables
cp .env.example .env

# Install dependencies
bun install

# Run the server
bun run start

# Development mode (with auto-reload)
bun run dev
```

## Features

### 🔒 Auth

- User registration and login through OAuth2: Google, Github and Discord
- Session management with Redis
- Authorization with roles (Admin, User)
- AWS Cognito integration for password-based authentication

### 🌐 HTTP

- Rate limiting pre-configured
- CORS support
- Timeouted requests: 5s maximum request time
- Elysia framework: super fast, minimal and type-safe

### 💵 Payments

- Stripe integration for payments
- Webhook handling for payment events
- Type-safe payment metadata handling

### 🔔 Notifications

- Notification system for admins through Discord
- Easy extensibility for other notification providers

### 💾 Database

- SQLc for auto-generated type-safe database queries
- PostgreSQL as the database engine
- Migration system

### 🗃️ Media Storage

- S3 for media storage with proper authorization
- Presigned URLs for secure file access

## Development Commands

### Database Operations
- **Generate queries**: `bun run generate` (runs `sqlc generate`)
- **Run migrations**: Handled automatically via Docker Compose migrate service

### Building and Deployment
- **Build**: `bun run build`
- **Docker build**: `docker build -t bun_app-api:latest .`
- **Docker Compose**: `docker-compose up` (runs full stack)

## Architecture

The application follows a clean architecture pattern with:

- **Services Layer**: Centralized dependency injection
- **Handlers**: Route handlers organized by domain
- **Middlewares**: Authentication, authorization, and request processing
- **Packages**: Reusable business logic modules

## Environment Variables

Copy `.env.example` to `.env` and configure the required variables. The application will validate all required environment variables on startup.