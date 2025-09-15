/**
 * TypeScript environment variable declarations for the application.
 * Provides type safety and documentation for all required and optional environment variables.
 */

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            /** The current environment mode. Can be 'development', 'production', or 'test'. */
            ENV: 'development' | 'production' | 'test';
            /** The address the server listens on. */
            LISTEN_ADDR: string;
            /** The base URL of the application. */
            BASE_URL: string;
            /** The database connection string. */
            DATABASE_URL: string;
            /** The secret key used for JWT authentication. */
            JWT_SECRET: string;
            /** Google OAuth client ID. */
            GOOGLE_CLIENT_ID?: string;
            /** Google OAuth client secret. */
            GOOGLE_CLIENT_SECRET?: string;
            /** GitHub OAuth client ID. */
            GITHUB_CLIENT_ID?: string;
            /** GitHub OAuth client secret. */
            GITHUB_CLIENT_SECRET?: string;
            /** Discord OAuth client ID. */
            DISCORD_CLIENT_ID?: string;
            /** Discord OAuth client secret. */
            DISCORD_CLIENT_SECRET?: string;
            /** The base path for OAuth redirects. */
            OAUTH_REDIRECT_URI_BASE: string;
            /** AWS Cognito client ID. */
            COGNITO_CLIENT_ID: string;
            /** AWS region for Cognito and S3. */
            AWS_REGION: string;
            /** The name of the S3 bucket used for storage. */
            S3_BUCKET: string;
            /** Stripe API key for payment processing. */
            STRIPE_API_KEY: string;
            /** Stripe webhook secret for verifying webhook signatures. */
            STRIPE_WEBHOOK_SECRET: string;
            /** The name of the device used in Stripe for payments. */
            STRIPE_DEVICE_NAME: string;
            /** Discord bot token for sending notifications. */
            DISCORD_BOT_TOKEN?: string;
            /** Discord channel ID for sending notifications. */
            DISCORD_CHANNEL_ID?: string;
            /** Redis connection URL. */
            REDIS_URL: string;
        }
    }
}

export {};