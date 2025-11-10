/**
 * Session management using Redis for storing user authentication sessions.
 * Handles session creation, retrieval, refresh, and cleanup with automatic expiration.
 */

import type { RedisClient } from "bun";
import type { SessionData } from '../../types/types';
import { UserRole } from '../enums';

/**
 * Session manager that uses Redis to store and manage user sessions.
 * Provides automatic expiration and session refresh capabilities.
 */
export class SessionManager {
  private client: RedisClient;

  /**
   * Initializes the session manager with a shared Redis client.
   *
   * @param redisClient Shared Redis client instance
   */
  constructor(redisClient: RedisClient) {
    this.client = redisClient;
  }

  /**
   * Creates a new user session and stores it in Redis.
   *
   * @param userId User ID to associate with the session
   * @param role User role for authorization purposes
   * @param status User status (active, inactive, banned)
   * @returns Promise<string> Generated session ID
   */
  async createSession({ userId, role, status }: { userId: string, role: UserRole, status?: 'active' | 'inactive' | 'banned' }): Promise<string> {
    const sessionId = this.generateSessionId();
    const sessionData: SessionData = {
      userId,
      role: role as unknown as typeof UserRole,
      status: status || 'active',
      exp: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
    };

    await this.client.set(sessionId, JSON.stringify(sessionData), "EXAT", Math.floor(sessionData.exp / 1000));

    return sessionId;
  }

  /**
   * Retrieves session data from Redis and checks expiration.
   * Automatically deletes expired sessions.
   * 
   * @param sessionId Session ID to retrieve
   * @returns Promise<SessionData | null> Session data or null if not found/expired
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    try {
      const result = await this.client.get(sessionId);
      if (!result) return null;

      const sessionData = JSON.parse(result);
      return sessionData;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Deletes a session from Redis (logout).
   * 
   * @param sessionId Session ID to delete
   * @returns Promise<void>
   */
  async deleteSession(sessionId: string): Promise<void> {
    await this.client.del(sessionId);
  }

  /**
   * Refreshes session expiration time to extend user login.
   * 
   * @param sessionId Session ID to refresh
   * @returns Promise<void>
   */
  async refreshSession(sessionId: string): Promise<void> {
    const sessionData = await this.getSession(sessionId);
    if (!sessionData) return;

    sessionData.exp = Date.now() + (24 * 60 * 60 * 1000);
    await this.client.set(sessionId, JSON.stringify(sessionData), "EXAT", Math.floor(sessionData.exp / 1000));
  }

  /**
   * @description
   * Generates a cryptographically secure session ID using the Web Crypto API.
   * The identifier is 128 bits (16 bytes) represented as a 32-char hex string.
   *
   * @returns {string} A secure identifier in hexadecimal format.
   */
  private generateSessionId(): string {
    const arr = new Uint8Array(16); // 128-bit
    crypto.getRandomValues(arr);

    const id = [...arr].map(b => b.toString(16).padStart(2, "0")).join("");
    return `sess:${id}`;
  }
}
