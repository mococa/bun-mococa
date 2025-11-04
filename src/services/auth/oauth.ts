/**
 * OAuth 2.0 integration for multiple providers (Google, GitHub, Discord).
 * Handles authorization flows, token exchange, and profile retrieval.
 */

import { Provider } from '../enums/enums';
import type { OAuthProfile } from '../../types/types';

const redirectUri = (provider: string) => `${process.env.BASE_URL}${process.env.OAUTH_REDIRECT_URI_BASE}/${provider}`;

/**
 * OAuth provider configuration interface.
 */
export interface OAuthConfig {
  name: Provider;
  clientId: string;
  clientSecret: string;
  urls: {
    auth: string;
    token: string;
    user: string;
  },
  scopes: string[];
}

const STATE_COOKIE_KEY = 'oauth_state';
const VERIFIER_COOKIE_KEY = 'oauth_pkce_verifier';
const COOKIE_EXPIRATION = 5 * 60; // 5 minutes

/**
 * OAuth manager that handles multiple OAuth providers and their authentication flows.
 * Supports Google, GitHub, and Discord OAuth 2.0 integrations.
 */
export class OAuthManager {
  private configs: Map<Provider, OAuthConfig> = new Map();

  /**
   * Initializes OAuth manager with provider configurations.
   * 
   * @param configs Array of OAuth provider configurations
   */
  constructor(configs: OAuthConfig[]) {
    for (const cfg of configs) {
      this.configs.set(cfg.name, cfg);
    }
  }

  /**
   * Generates OAuth authorization URL for the specified provider.
   * 
   * @param provider OAuth provider (Google, GitHub, Discord)
   * @param state CSRF protection state parameter
   * @returns string Authorization URL to redirect user to
   * @throws Error if provider is not configured or unsupported
   */
  async getAuthUrl(provider: Provider, setCookie: (name: string, value: string, exp: number) => void) {
    const cfg = this.configs.get(provider);
    if (!cfg) {
      throw new Error(`OAuth provider ${provider} not configured`);
    }

    const verifier = crypto.randomUUID();
    const state = crypto.randomUUID();

    setCookie(STATE_COOKIE_KEY, state, COOKIE_EXPIRATION);
    setCookie(VERIFIER_COOKIE_KEY, verifier, COOKIE_EXPIRATION);
    
    const params = new URLSearchParams({
      client_id: cfg.clientId,
      redirect_uri: redirectUri(provider),
      response_type: 'code',
      state,
      code_challenge_method: 'S256',
      code_challenge: await this.generateCodeChallenge(verifier),
      scope: cfg.scopes.join(' '),
    });

    return `${cfg.urls.auth}?${params.toString()}`;
  }

  /**
   * Exchanges OAuth authorization code for user profile information.
   * 
   * @param provider OAuth provider that returned the code
   * @param code Authorization code from OAuth callback
   * @returns Promise<OAuthProfile> Standardized user profile data
   * @throws Error if provider is not configured or exchange fails
   */
  async exchangeCodeForProfile(provider: Provider, code: string, state: string, getCookie: (name: string) => string): Promise<OAuthProfile> {
    const cfg = this.configs.get(provider);
    if (!cfg) {
      throw new Error(`OAuth provider ${provider} not configured`);
    }
    
    const storedState = getCookie(STATE_COOKIE_KEY);
    const verifier = getCookie(VERIFIER_COOKIE_KEY);

    if (state !== storedState) throw new Error('Invalid state parameter');
    if (!verifier) throw new Error('Missing PKCE verifier');
        
    switch (provider) {
      case Provider.GOOGLE:
        return this.handleGoogleOAuth(code, verifier);
      case Provider.GITHUB:
        return this.handleGitHubOAuth(code, verifier);
      case Provider.DISCORD:
        return this.handleDiscordOAuth(code, verifier);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * Handles Google OAuth 2.0 token exchange and profile retrieval.
   * 
   * @param cfg Google OAuth configuration
   * @param code Authorization code from Google
   * @param redirectUri Redirect URI used in the OAuth flow
   * @returns Promise<OAuthProfile> Google user profile data
   */
  private async handleGoogleOAuth(code: string, verifier: string): Promise<OAuthProfile> {
    const profile = await this.fetchUser(Provider.GOOGLE, code, verifier);
    
    return {
      id: profile.sub,
      name: profile.name,
      email: profile.email,
      picture: profile.picture,
      provider: Provider.GOOGLE,
    };
  }

  /**
   * Handles GitHub OAuth token exchange and profile retrieval.
   * Includes additional API call to get primary email address.
   * 
   * @param cfg GitHub OAuth configuration
   * @param code Authorization code from GitHub
   * @param redirectUri Redirect URI used in the OAuth flow
   * @returns Promise<OAuthProfile> GitHub user profile data
   */
  private async handleGitHubOAuth(code: string, verifier: string): Promise<OAuthProfile> {
    const profile = await this.fetchUser(Provider.GITHUB, code, verifier);
    
    // GitHub may not return email in the initial profile response
    let email: string = profile.email;
    if (!email) {
      const emailsResponse = await fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${profile.access_token}` },
      });
      const emails = await emailsResponse.json();
      const primaryEmail = emails.find((e: any) => e.primary) || emails[0];
      email = primaryEmail?.email;
    }

    if (!email) {
      throw new Error('Email not available from GitHub profile');
    }

    return {
      id: profile.id.toString(),
      name: profile.name || profile.login,
      email,
      picture: profile.avatar_url,
      provider: Provider.GITHUB,
    };
  }

  /**
   * Handles Discord OAuth token exchange and profile retrieval.
   * 
   * @param cfg Discord OAuth configuration
   * @param code Authorization code from Discord
   * @param redirectUri Redirect URI used in the OAuth flow
   * @returns Promise<OAuthProfile> Discord user profile data
   */
  private async handleDiscordOAuth(code: string, verifier: string): Promise<OAuthProfile> {
    const profile = await this.fetchUser(Provider.DISCORD, code, verifier);
    if (!profile.verified) throw new Error('Discord email not verified');

    return {
      id: profile.id,
      name: profile.username,
      email: profile.email,
      picture: profile.avatar ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png` : undefined,
      provider: Provider.DISCORD,
    };
  }

  private async fetchUser(provider: Provider, code: string, verifier: string) {
    const cfg = this.configs.get(provider);
    if (!cfg) {
      throw new Error(`OAuth provider ${provider} not configured`);
    }

     // Exchange code for token
    const tokenResponse = await fetch(cfg.urls.token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        code,
        code_verifier: verifier,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri(provider),
      }),
    });

    const tokens = await tokenResponse.json();
    
    // Get user profile
    const profileResponse = await fetch(cfg.urls.user, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const profile = await profileResponse.json();
    profile.access_token = tokens.access_token; // Attach access token for further use if needed
    return profile;
  }

  private async generateCodeChallenge(verifier: string) {
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
    return Buffer.from(hash).toString('base64url');
  }

  /**
   * Generates HTML response for OAuth callback with window.postMessage.
   * Used to pass user data and session token back to the opening window.
   *
   * @param user User data to return
   * @param sessionId Session token for the authenticated user
   * @returns HTML string with JavaScript to post message to opener
   */
  html(user: any, sessionId: string) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Success</title>
      </head>

      <body>
        <p>Redirecting...</p>

        <script>
          function send(data) {
            if (!window.opener || window.opener.closed) {
              alert("Please close this window and return to the application.");
              window.close();
              return;
            }

            window.opener.postMessage({
              type: "oauth-callback",
              data,
            }, "*");

            window.onmessage = (event) => {
              if (event.data === 'close') {
                window.close();
              }
            }
          }
          {{script}}
        </script>
      </body>
    </html>
    `.replace('{{script}}', `send(${JSON.stringify({ user, sessionId })});`);
  }
}