import { createDb, type Database } from "@pincerpay/db";

// Singleton database connection for the dashboard
let db: Database | undefined;

export function getDb(): Database {
  if (!db) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    const result = createDb(process.env.DATABASE_URL, { serverless: true });
    db = result.db;
  }
  return db;
}
