/**
 * Type definitions for the application context and related interfaces.
 * Extends Elysia's base types with application-specific context and data structures.
 */

import type { SingletonBase } from 'elysia';
import { services } from '../services/services';

/**
 * Type alias for the services container, extracted from the services instance.
 */
export type Services = typeof services

/**
 * Extended application context that augments Elysia's base context.
 * Provides access to all services and user authentication state.
 */
export interface AppContext extends SingletonBase {
  decorator: {
    services: Services;
    userId?: number;
    role: Services['enums']['UserRole'];
    sessionId?: string;
  },
  store: Record<string, unknown>;
}

/**
 * Session data structure stored in Redis for authenticated users.
 * Contains user ID, role, and expiration timestamp.
 */
export interface SessionData {
  userId: number;
  role: Services['enums']['UserRole'];
  exp: number;
}

/**
 * OAuth profile data structure returned by OAuth providers.
 * Contains standardized user information from Google, GitHub, Discord, etc.
 */
export interface OAuthProfile {
  id: string;
  name: string;
  email: string;
  picture?: string;
  provider: string;
}
