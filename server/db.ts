import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";

// Check if DATABASE_URL is defined
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not defined");
}

// Create a client with environment-specific configuration
const client = postgres(process.env.DATABASE_URL, { 
  max: 10,
  ssl: process.env.NODE_ENV === 'production',
  connect_timeout: 10,
  idle_timeout: 20
});

// Create database instance
export const db = drizzle(client, { schema });
