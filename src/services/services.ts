/**
 * Central services container that provides dependency injection for all external services.
 * This singleton contains instances of all services needed throughout the application.
 */

import { Auth } from "./auth/auth";
import { AWS } from "./aws/aws";
import { Notifier } from "./notifier/notifier";
import { Payments } from "./payments";
import * as enums from "./enums";

/**
 * Main services container with all application services.
 * Provides auth, AWS, notifications, payments, and enums.
 */
export const services = {
    auth: new Auth(),
    aws: new AWS(),
    enums,
    notifications: new Notifier(),
    payments: new Payments(),
};
