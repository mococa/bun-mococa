/**
 * Admin handler aggregator that combines all admin-only routes.
 * These endpoints require authentication and admin role.
 */

import Elysia from "elysia";
import * as hello from "./hello";
import { adminMiddleware } from "../../middlewares";

/**
 * Combined admin handlers with /admin prefix and admin middleware applied.
 */
export const handlers = new Elysia({ prefix: '/admin' })
  .derive(adminMiddleware)
  .use(hello.handlers());