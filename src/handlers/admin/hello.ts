/**
 * Admin-only greeting handlers for testing admin access.
 * These endpoints require both authentication and admin role.
 */

/* ---------- External ---------- */
import { Elysia, SingletonBase, t } from 'elysia';

/* ---------- Types ---------- */
import { AppContext } from '../../types/types';

/**
 * Creates admin hello route handlers for testing admin functionality.
 * 
 * @returns Elysia instance with /hello prefix and admin greeting route
 */
export function handlers() {
  return new Elysia<'/hello', AppContext>({ prefix: '/hello' })
    .get('/', () => 'Hello, Admin!');
}
