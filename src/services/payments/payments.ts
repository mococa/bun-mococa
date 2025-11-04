/**
 * Payment services container that manages payment integrations and metadata utilities.
 * Provides centralized access to all payment-related functionality.
 */

import type { RedisClient } from 'bun';
import * as metadata from "./metadata";
import { StripePayment } from "./stripe";
import { Abacate } from "./abacatepay";

/**
 * Main payments service that orchestrates payment integrations and metadata handling.
 * Includes AbacatePay (primary) and Stripe (legacy support).
 */
export class Payments {
    metadata = metadata;
    stripe: StripePayment = new StripePayment();
    abacate: Abacate;

    /**
     * Initializes payment services with shared Redis client.
     *
     * @param redisClient Shared Redis client instance for payment polling
     */
    constructor(redisClient: RedisClient) {
        const abacateApiKey = process.env.ABACATE_API_KEY || '';
        this.abacate = new Abacate(abacateApiKey, redisClient);
    }
}
