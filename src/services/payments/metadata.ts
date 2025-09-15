/**
 * Payment metadata utilities for Stripe payment intent tracking.
 * Handles conversion between typed data and Stripe's string-only metadata.
 */

/**
 * Payment metadata structure for tracking user and item associations.
 */
export interface PaymentMetadata {
  userId: string;
  stuffId: string;
  [key: string]: string;
}

/**
 * Creates payment metadata from user and item IDs.
 * Converts numbers to strings as required by Stripe metadata.
 * 
 * @param userId User ID associated with the payment
 * @param stuffId Item/product ID associated with the payment
 * @returns PaymentMetadata Formatted metadata for Stripe
 */
export function createPaymentMetadata(userId: number, stuffId: number): PaymentMetadata {
  return {
    userId: userId.toString(),
    stuffId: stuffId.toString(),
  };
}

/**
 * Parses payment metadata from Stripe payment intent metadata.
 * Validates required fields and returns null if invalid.
 * 
 * @param metadata Raw metadata from Stripe payment intent
 * @returns PaymentMetadata | null Parsed metadata or null if invalid
 */
export function parsePaymentMetadata(metadata: Record<string, string>): PaymentMetadata | null {
  if (!metadata.userId || !metadata.stuffId) {
    return null;
  }

  return {
    userId: metadata.userId,
    stuffId: metadata.stuffId,
    ...metadata,
  };
}