/**
 * Database connection factory using bun:sqlite with Drizzle ORM.
 * Provides configured SQLite connection with migrations support.
 */

import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { schema } from './schema';

const DATABASE_PATH = 'database.db';

/**
 * Creates a configured SQLite database connection with Drizzle ORM and runs migrations.
 *
 * @returns Drizzle database instance
 */
export const createDatabase = async () => {
  const sqlite = new Database(DATABASE_PATH, { create: true });

  // Enable foreign keys
  sqlite.run('PRAGMA foreign_keys = ON');

  // Run migrations
  await runMigrations(sqlite);

  // Return Drizzle instance
  const db = drizzle(sqlite, { schema });
  return db;
};

/**
 * Runs all SQL migration files in the migrations directory.
 * Tracks which migrations have already been run to avoid re-running them.
 *
 * @param db SQLite database instance
 */
async function runMigrations(db: Database) {
  // Create migrations tracking table if it doesn't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL UNIQUE,
      executed_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `);

  const migrationsDir = process.env.MIGRATIONS_DIR ?? join(__dirname, 'migrations');

  try {
    const files = await readdir(migrationsDir);
    const migrationFiles = files.filter((f) => f.endsWith('.up.sql')).sort(); // Ensure migrations run in order

    for (const file of migrationFiles) {
      // Check if migration has already been run
      const existingMigration = db
        .query('SELECT filename FROM _migrations WHERE filename = ?')
        .get(file);

      if (existingMigration) {
        console.log(`⊘ Skipping migration: ${file} (already executed)`);
        continue;
      }

      const filePath = join(migrationsDir, file);
      const sql = await Bun.file(filePath).text();

      console.log(`Running migration: ${file}`);

      // Split by semicolon and execute each statement
      const statements = sql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const statement of statements) {
        db.run(statement);
      }

      // Record that this migration has been run
      db.run('INSERT INTO _migrations (filename) VALUES (?)', [file]);

      console.log(`✓ Migration ${file} completed`);
    }
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

export type ApiDatabase = Awaited<ReturnType<typeof createDatabase>>;