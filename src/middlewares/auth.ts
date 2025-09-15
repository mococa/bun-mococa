/**
 * Authentication middleware that validates session tokens and adds user context.
 * Extracts session data from Authorization header and refreshes sessions.
 */

import type { Context } from 'elysia';
import type { AppContext } from '../types/types';

/**
 * Middleware that validates Bearer token sessions and adds userId/role to context.
 * Throws AuthError (401) if authentication fails.
 * 
 * @param ctx Elysia context with services and request data
 * @returns Promise<void>
 * @throws AuthError When no token provided or session invalid
 */
export const authMiddleware = async (ctx: Context): Promise<void> => {
  const context = ctx as Context & AppContext['decorator'];

  const sessionId = context.headers['authorization']?.replace('Bearer ', '');
  if (!sessionId) throw new AuthError('No session token provided');
  
  const sessionData = await context.services.auth.sessions.getSession(sessionId);
  if (!sessionData) throw new AuthError('Invalid or expired session');

  // Refresh session
  await context.services.auth.sessions.refreshSession(sessionId);

  // Add user info to context
  context.userId = sessionData.userId;
  context.role = sessionData.role;
  context.sessionId = sessionId;
};

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
