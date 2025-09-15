/**
 * Stripe payment integration service for handling payment intents, webhooks, and transactions.
 * Provides comprehensive payment functionality with metadata handling for user and item tracking.
 */

import Stripe from 'stripe';
import { createPaymentMetadata, parsePaymentMetadata, type PaymentMetadata } from './metadata';

/**
 * Stripe payment service wrapper that handles payment intents, confirmations, and webhook validation.
 * Includes utility methods for amount conversion and payment status checking.
 */
export class StripePayment {
  private stripe: Stripe;

  /**
   * Initializes Stripe client with API key and latest API version.
   */
  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_API_KEY, {
      apiVersion: '2025-02-24.acacia',
    });
  }

  /**
   * Creates a Stripe payment intent with user and item metadata.
   * 
   * @param amount Payment amount in cents
   * @param currency Payment currency (default: 'usd')
   * @param userId User ID for payment tracking
   * @param stuffId Item/product ID for payment tracking
   * @returns Promise<Stripe.PaymentIntent> Created payment intent
   */
  async createPaymentIntent(
    amount: number,
    currency: string = 'usd',
    userId: number,
    stuffId: number
  ): Promise<Stripe.PaymentIntent> {
    const metadata = createPaymentMetadata(userId, stuffId);
    
    return await this.stripe.paymentIntents.create({
      amount,
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });
  }

  /**
   * Retrieves a payment intent by ID.
   * 
   * @param paymentIntentId Stripe payment intent ID
   * @returns Promise<Stripe.PaymentIntent> Payment intent data
   */
  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    return await this.stripe.paymentIntents.retrieve(paymentIntentId);
  }

  /**
   * Confirms a payment intent (completes the payment).
   * 
   * @param paymentIntentId Stripe payment intent ID
   * @returns Promise<Stripe.PaymentIntent> Confirmed payment intent
   */
  async confirmPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    return await this.stripe.paymentIntents.confirm(paymentIntentId);
  }

  /**
   * Cancels a payment intent before completion.
   * 
   * @param paymentIntentId Stripe payment intent ID
   * @returns Promise<Stripe.PaymentIntent> Canceled payment intent
   */
  async cancelPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    return await this.stripe.paymentIntents.cancel(paymentIntentId);
  }

  /**
   * Constructs and validates a Stripe webhook event from request data.
   * 
   * @param body Raw webhook request body
   * @param signature Stripe signature header for validation
   * @returns Stripe.Event Validated webhook event
   * @throws Error if signature validation fails
   */
  constructWebhookEvent(body: string, signature: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  }

  /**
   * Extracts and parses payment metadata from a payment intent.
   * 
   * @param paymentIntent Stripe payment intent with metadata
   * @returns PaymentMetadata | null Parsed metadata or null if invalid
   */
  parsePaymentIntentMetadata(paymentIntent: Stripe.PaymentIntent): PaymentMetadata | null {
    return parsePaymentMetadata(paymentIntent.metadata);
  }

  /**
   * Lists recent payment intents with optional limit.
   * 
   * @param limit Maximum number of payment intents to retrieve (default: 10)
   * @returns Promise<Stripe.ApiList<Stripe.PaymentIntent>> List of payment intents
   */
  async listPaymentIntents(limit: number = 10): Promise<Stripe.ApiList<Stripe.PaymentIntent>> {
    return await this.stripe.paymentIntents.list({ limit });
  }

  /**
   * Checks if a payment intent has succeeded.
   * 
   * @param paymentIntent Stripe payment intent to check
   * @returns boolean True if payment succeeded
   */
  isPaymentSucceeded(paymentIntent: Stripe.PaymentIntent): boolean {
    return paymentIntent.status === 'succeeded';
  }

  /**
   * Checks if a payment intent has failed or been canceled.
   * 
   * @param paymentIntent Stripe payment intent to check
   * @returns boolean True if payment failed or was canceled
   */
  isPaymentFailed(paymentIntent: Stripe.PaymentIntent): boolean {
    return ['requires_payment_method', 'canceled'].includes(paymentIntent.status);
  }

  /**
   * Converts dollar amount to cents for Stripe API.
   * 
   * @param amountInDollars Amount in dollars (e.g., 19.99)
   * @returns number Amount in cents (e.g., 1999)
   */
  getAmountInCents(amountInDollars: number): number {
    return Math.round(amountInDollars * 100);
  }

  /**
   * Converts cents amount to dollars for display.
   * 
   * @param amountInCents Amount in cents from Stripe (e.g., 1999)
   * @returns number Amount in dollars (e.g., 19.99)
   */
  getAmountInDollars(amountInCents: number): number {
    return amountInCents / 100;
  }
}
