/**
 * Public handler aggregator that combines all public routes.
 * These endpoints are accessible without authentication.
 */

import Elysia from "elysia";
import * as auth from "./auth";

/**
 * Combined public handlers including authentication endpoints.
 */
export const handlers = new Elysia()
    .use(auth.handlers());