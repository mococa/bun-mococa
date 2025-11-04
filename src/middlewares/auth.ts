/**
 * Authentication middleware that validates session tokens and adds user context.
 * Extracts session data from Authorization header and refreshes sessions.
 */

import type { Context } from 'elysia';
import type { AppContext } from '../types/types';

/**
 * Middleware that validates Bearer token sessions and adds userId/role/status to context.
 * Throws AuthError (401) if authentication fails.
 * Throws AuthError (403) if user is banned.
 *
 * @param ctx Elysia context with services and request data
 * @returns Promise<void>
 * @throws AuthError When no token provided, session invalid, or user is banned
 */
export const authMiddleware = async (ctx: Context): Promise<void> => {
  const context = ctx as Context & AppContext['decorator'];

  const sessionId = context.headers['authorization']?.replace('Bearer ', '');
  if (!sessionId) throw new AuthError('No session token provided');

  const sessionData = await context.services.auth.sessions.getSession(sessionId);
  if (!sessionData) throw new AuthError('Invalid or expired session');

  // Block banned users from accessing any authenticated routes
  if (sessionData.status === 'banned') {
    throw new BannedUserError('Your account has been banned. Please contact support.');
  }

  // Refresh session
  await context.services.auth.sessions.refreshSession(sessionId);

  // Add user info to context
  context.userId = sessionData.userId;
  context.role = sessionData.role;
  context.status = sessionData.status;
  context.sessionId = sessionId;
};

/**
 * Custom banned user error with 403 status code.
 */
class BannedUserError extends Error {
  status: number = 403;
  name = "BannedUserError";

  /**
   * Creates a banned user error with JSON-formatted message.
   *
   * @param message Error message to include in response
   */
  constructor(message: string) {
    super(JSON.stringify({ message }));
  }
}

/**
 * Custom authentication error with 401 status code.
 */
class AuthError extends Error {
  status: number = 401;
  name = "AuthError";

  /**
   * Creates an authentication error with JSON-formatted message.
   * 
   * @param message Error message to include in response
   */
  constructor(message: string) {
    super(JSON.stringify({ message }));
  }
}
