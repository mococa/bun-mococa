/**
 * Drizzle ORM schema definitions for SQLite database.
 * Defines all tables, relationships, and constraints.
 */

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql, relations } from 'drizzle-orm';

// ============= Core User Management =============

const users = sqliteTable('users', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(12))))`),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  name: text('name'),
  email: text('email').notNull().unique(),
  picture: text('picture').default(''),
  role: text('role', { enum: ['admin', 'user'] })
    .notNull()
    .default('user'),
  status: text('status', { enum: ['active', 'inactive', 'banned'] })
    .notNull()
    .default('active'),
});

const oauthAccounts = sqliteTable('oauth_accounts', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(12))))`),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(), // 'google', 'github', or 'discord'
  providerId: text('provider_id').notNull(),
});

// Type exports for use in application code
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type OAuthAccount = typeof oauthAccounts.$inferSelect;
export type NewOAuthAccount = typeof oauthAccounts.$inferInsert;

// ============= Relations =============

export const usersRelations = relations(users, ({ many }) => ({
  oauthAccounts: many(oauthAccounts),
}));

export const oauthAccountsRelations = relations(oauthAccounts, ({ one }) => ({
  user: one(users, {
    fields: [oauthAccounts.userId],
    references: [users.id],
  }),
}));

/**
 * Database schema object containing all Drizzle table definitions.
 */
export const schema = {
  users,
  oauthAccounts,
  // relations
  usersRelations,
  oauthAccountsRelations,
};
