/**
 * Private authentication handlers for authenticated user actions.
 * These endpoints require valid authentication tokens.
 */

import Elysia from "elysia";
import { AppContext } from "../../types/types";

/**
 * Private authentication route handlers requiring authentication.
 * Currently provides logout functionality.
 */
export const handlers = new Elysia<"/auth", AppContext>({ prefix: "/auth" })
    .get("/logout", async ({ services, sessionId }) => {
        if (!sessionId) throw new Error("No active session");
        await services.auth.sessions.deleteSession(sessionId);

        return { message: "Logged out successfully" };
    });