/**
 * User role enumeration for authorization and access control.
 */
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

/**
 * User account status enumeration for user management.
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BANNED = 'banned',
}

/**
 * Payment transaction status enumeration for payment processing.
 */
export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * OAuth provider enumeration for supported authentication providers.
 */
export enum Provider {
  GOOGLE = 'google',
  GITHUB = 'github',
  DISCORD = 'discord',
}