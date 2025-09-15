/**
 * Notification message templates and utilities for system events.
 * Provides structured message creation for payments, users, and system errors.
 */

/**
 * Structured notification message interface for rich formatting.
 */
export interface NotificationMessage {
  title: string;
  content: string;
  timestamp?: Date;
  color?: number;
}

/**
 * Creates a payment success notification message.
 * 
 * @param userId User ID who made the payment
 * @param amount Payment amount in cents
 * @param transactionId Stripe transaction ID
 * @returns NotificationMessage Formatted success message
 */
export const createPaymentSuccessMessage = (
  {userId, transactionId, amount}: {userId: number,
  amount: number,
  transactionId: string}
): NotificationMessage => ({
  title: '💰 Payment Successful',
  content: `User ID ${userId} completed payment of $${(amount / 100).toFixed(2)} (Transaction: ${transactionId})`,
  timestamp: new Date(),
  color: 0x00ff00, // Green
});

/**
 * Creates a payment failure notification message.
 * 
 * @param userId User ID who attempted the payment
 * @param amount Payment amount in cents
 * @param transactionId Stripe transaction ID
 * @param reason Optional failure reason
 * @returns NotificationMessage Formatted failure message
 */
export const createPaymentFailureMessage = (
  {userId, amount, transactionId, reason}: {userId: number,
  amount: number,
  transactionId: string,
  reason?: string}
): NotificationMessage => ({
  title: '❌ Payment Failed',
  content: `User ID ${userId} failed payment of $${(amount / 100).toFixed(2)} (Transaction: ${transactionId})${reason ? ` - Reason: ${reason}` : ''}`,
  timestamp: new Date(),
  color: 0xff0000, // Red
});

/**
 * Creates a user registration notification message.
 * 
 * @param userId New user ID
 * @param email User's email address
 * @param provider Optional OAuth provider used for registration
 * @returns NotificationMessage Formatted registration message
 */
export const createUserRegistrationMessage = (
  {email, userId, provider}: {userId: number,
  email: string,
  provider?: string}
): NotificationMessage => ({
  title: '🎉 New User Registration',
  content: `New user registered: ${email} (ID: ${userId})${provider ? ` via ${provider}` : ''}`,
  timestamp: new Date(),
  color: 0x0099ff, // Blue
});

/**
 * Creates a system error notification message.
 * 
 * @param error Error description
 * @param context Optional additional context information
 * @returns NotificationMessage Formatted error message
 */
export const createErrorMessage = (
  {error}: {error: string,}
): NotificationMessage => ({
  title: '🚨 System Error',
  content: `Error occurred: ${error}`,
  timestamp: new Date(),
  color: 0xff6600, // Orange
});

/**
 * Centralized notification message factory with organized categories.
 * Provides easy access to all notification message creators.
 */
const messages = {
  payments: {
    success: createPaymentSuccessMessage,
    failure: createPaymentFailureMessage,
  },
  users: {
    registration: createUserRegistrationMessage,
  },
  system: {
    error: createErrorMessage,
  }
} as const;

// 3. Getter function returning tuple [path, value]
export function getMessage<P extends MessagePaths>(path: P): MessageValue<P> {
  const [category, type] = path.split(".") as [keyof typeof messages, keyof typeof messages[keyof typeof messages]];
  const value = messages[category][type];
  return value[1];
}

export type MessagePaths = {
  [K in keyof typeof messages]: {
    [L in keyof typeof messages[K]]: `${K & string}.${L & string}`;
  }[keyof typeof messages[K]];
}[keyof typeof messages];

export type MessageValue<P extends string> =
  P extends `${infer K}.${infer L}`
    ? K extends keyof typeof messages
      ? L extends keyof typeof messages[K]
        ? typeof messages[K][L]
        : never
      : never
    : never;
