/**
 * Central services container that provides dependency injection for all external services.
 * This singleton contains instances of all services needed throughout the application.
 */

import { RedisClient } from "bun";
import { Auth } from "./auth/auth";
import { AWS } from "./aws/aws";
import { Notifier } from "./notifier/notifier";
import { Payments } from "./payments";
import * as enums from "./enums";

// Create a single Redis client instance to be shared across services
const redisClient = new RedisClient();
redisClient.connect();
redisClient.onconnect = () => {
  console.log('Connected to Redis');
};

/**
 * Main services container with all application services.
 * Provides auth, AWS, notifications, payments, and enums.
 * All services share a single Redis client instance.
 */
export const services = {
    auth: new Auth(redisClient),
    aws: new AWS(),
    enums,
    notifications: new Notifier(),
    payments: new Payments(redisClient),
};
