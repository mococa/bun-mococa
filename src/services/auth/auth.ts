/**
 * Main authentication service that coordinates OAuth, Cognito, and session management.
 * Provides centralized authentication functionality for all providers.
 */

import { Provider } from '../enums/enums';
import { SessionManager } from './sessions';
import { OAuthManager, type OAuthConfig } from './oauth';

/**
 * Authentication service that manages OAuth providers, AWS Cognito, and user sessions.
 * Automatically configures available OAuth providers based on environment variables.
 */
export class Auth {
  public sessions: SessionManager;
  public oauth: OAuthManager;

  /**
   * Initializes the authentication service with session manager, Cognito auth,
   * and configures OAuth providers based on available environment variables.
   */
  constructor() {
    this.sessions = new SessionManager();
    
    // Configure OAuth providers
    const oauthConfigs: OAuthConfig[] = [];

    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      oauthConfigs.push({
        name: Provider.GOOGLE,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        urls: {
          auth: 'https://accounts.google.com/o/oauth2/auth',
          token: 'https://oauth2.googleapis.com/token',
          user: 'https://www.googleapis.com/oauth2/v3/userinfo',
        },
        scopes: [
          "https://www.googleapis.com/auth/userinfo.profile",
				  "https://www.googleapis.com/auth/userinfo.email",
        ],
      });
    }

    if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
      oauthConfigs.push({
        name: Provider.GITHUB,
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        urls: {
          auth:  "https://api.github.com/login/oauth/authorize",
          token: "https://api.github.com/login/oauth/access_token",
          user:  "https://api.github.com/user",
        },
        scopes: ["read:user", "user:email"]
      });
    }

    if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
      oauthConfigs.push({
        name: Provider.DISCORD,
        clientId: process.env.DISCORD_CLIENT_ID,
        clientSecret: process.env.DISCORD_CLIENT_SECRET,
        urls: {
          auth:  "https://discord.com/api/oauth2/authorize",
				  token: "https://discord.com/api/oauth2/token",
				  user:  "https://discord.com/api/users/@me",
        },
        scopes: ["identify", "email"]
      });
    }

    this.oauth = new OAuthManager(oauthConfigs);
  }

  /**
   * Generates a secure random state string for OAuth flows.
   * 
   * @returns string Cryptographically secure random UUID for OAuth state parameter
   */
  generateState(): string {
    return crypto.randomUUID();
  }
}