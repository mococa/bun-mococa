/**
 * Payment services container that manages Stripe integration and metadata utilities.
 * Provides centralized access to all payment-related functionality.
 */

import * as metadata from "./metadata";
import { StripePayment } from "./stripe";

/**
 * Main payments service that orchestrates Stripe integration and payment metadata handling.
 */
export class Payments {
    metadata = metadata;
    stripe: StripePayment = new StripePayment();
}
