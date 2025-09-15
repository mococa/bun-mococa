/**
 * Admin authorization middleware that ensures user has admin role.
 * Must be used after authentication middleware to access user role.
 */

import type { Context } from 'elysia';
import type { AppContext } from '../types/types';
import { UserRole } from '../services/enums/enums';

/**
 * Middleware that checks if authenticated user has admin role.
 * Throws AdminError (403) if user is not authenticated or lacks admin privileges.
 * 
 * @param context Elysia context with user authentication data
 * @throws AdminError When user is not authenticated or not an admin
 */
export const adminMiddleware = (context: Context) => {
  const ctx = context as Context & AppContext['decorator'];
  if (!ctx.userId) throw new AdminError('Authentication required');
  
  const role = ctx.role as unknown as UserRole;
  if (role !== UserRole.ADMIN) {
    throw new AdminError('Admin access required');
  }

  return;
};

/**
 * Custom admin authorization error with 403 status code.
 */
class AdminError extends Error {
  status: number = 403;
  name = "AdminError";

  /**
   * Creates an admin authorization error with JSON-formatted message.
   * 
   * @param message Error message to include in response
   */
  constructor(message: string) {
    super(JSON.stringify({ message }));
  }
}
