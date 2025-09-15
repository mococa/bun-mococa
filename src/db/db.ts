/**
 * Database connection factory using postgres.js.
 * Provides configured PostgreSQL connection with custom type parsing.
 */

import { SQL } from 'bun';

/**
 * Creates a configured PostgreSQL connection with custom type parsing for dates and timestamps.
 * 
 * @returns postgres.Sql Configured postgres.js connection instance
 */
export const createDatabase = async () => {
  const sql = new SQL(process.env.DATABASE_URL, {
    max: 20,
    idle_timeout: 20,
    connect_timeout: 60,
  });

  await sql.connect();

  return sql;
};