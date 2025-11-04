/**
 * Main application entry point for the Bun/Elysia server.
 * Sets up the HTTP server with CORS, OpenAPI, authentication, and route handlers.
 */

import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { openapi } from '@elysiajs/openapi'

import { checkEnv } from './config';

import { services } from './services';

// Auth handlers
import { Admin, Private, Public } from './handlers';
import { createDatabase } from './db/db';
import { crons } from './crons';

// Validate environment variables
checkEnv();

const db = await createDatabase();

/**
 * Creates and configures the Elysia application with middleware and routes.
 * 
 * @returns Promise<Elysia> Configured Elysia application instance
 */
async function createApp() {
  const app = new Elysia({ serve: { idleTimeout: 10 } })
    .use(openapi())
    // Global middlewares
    .use(cors({
      origin: ['http://localhost:3000', 'https://my_app.com'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Origin', 'Content-Type', 'Accept', 'Authorization', 'X-Admin-Token'],
      exposeHeaders: ['Content-Length'],
      credentials: false,
    }))
    .decorate('db', db)
    .decorate('services', services)
    .get('/', (c) => `Welcome to the server!`)
    .get('/health', () => 'OK')
    .use(crons({ db, services }))
    .use(Public.handlers)
    .use(Private.handlers)
    .use(Admin.handlers)
    .onError(({ error }) => {
      if (!('message' in error)) return;

      services.notifications.notify('system.error', { error: error.message });
    });

  return app;
}

// Start server
/**
 * Main function that starts the server and handles graceful shutdown.
 * Validates environment variables, creates the app, and starts listening on the configured port.
 */
async function main() {
  try {
    const app = await createApp();

    const port = process.env.LISTEN_ADDR.split(':')[1];

    app.listen(port, () => {
      console.log(`🦊 Elysia is running at http://localhost:${port}`);
    });

    // Handle shutdown signals
    process.on('SIGINT', () => {
      console.log('Received SIGINT, shutting down gracefully...');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('Received SIGTERM, shutting down gracefully...');
      process.exit(0);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the application
main();