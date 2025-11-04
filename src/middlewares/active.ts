/**
 * Active user middleware that ensures user is not inactive or banned.
 * Must be used after authentication middleware to access session data.
 */

import type { Context } from 'elysia';
import type { AppContext } from '../types/types';

/**
 * Middleware that checks if authenticated user is active (not inactive or banned).
 * Uses status from session data to avoid database queries.
 * Throws InactiveUserError (403) if user is inactive or banned.
 *
 * @param context Elysia context with user authentication data
 * @throws InactiveUserError When user is inactive or banned
 */
export const activeUserMiddleware = async (context: Context) => {
  const ctx = context as Context & AppContext['decorator'];

  // Get session data to check user status
  const sessionData = await ctx.services.auth.sessions.getSession(ctx.sessionId);
  if (!sessionData) throw new InactiveUserError('Session not found');

  // Check status from session
  if (sessionData.status === 'inactive') {
    throw new InactiveUserError(
      'Your account is inactive. You cannot perform this action. Please contact support.',
    );
  }

  return;
};

/**
 * Custom inactive user error with 403 status code.
 */
class InactiveUserError extends Error {
  status: number = 403;
  name = 'InactiveUserError';

  /**
   * Creates an inactive user error with JSON-formatted message.
   *
   * @param message Error message to include in response
   */
  constructor(message: string) {
    super(JSON.stringify({ message }));
  }
}
