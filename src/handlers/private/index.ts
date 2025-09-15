/**
 * Private handler aggregator that combines all authenticated routes.
 * These endpoints require valid authentication tokens.
 */

import Elysia from "elysia";
import * as auth from "./auth";
import { authMiddleware } from "../../middlewares";

/**
 * Combined private handlers with authentication middleware applied.
 */
export const handlers = new Elysia()
    .derive(authMiddleware)
    .use(auth.handlers);