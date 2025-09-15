/**
 * Admin handler aggregator that combines all admin-only routes.
 * These endpoints require authentication and admin role.
 */

import Elysia from "elysia";
import * as hello from "./hello";
import * as auth from "./auth";
import { adminMiddleware } from "../../middlewares";

/**
 * Combined admin handlers with /admin prefix and admin middleware applied.
 */
export const handlers = new Elysia({ prefix: '/admin' })
  .use(auth.handlers())
  .derive(adminMiddleware)
  .use(hello.handlers());