import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";

const isDev = process.env.NODE_ENV !== 'production';
const connectionString = isDev ? 
  'postgresql://postgres:postgres@localhost:5432/smartspend' : 
  process.env.DATABASE_URL;

const client = postgres(connectionString, {
  max: 10,
  ssl: !isDev ? {
    rejectUnauthorized: false 
  } : false,
  connect_timeout: 30,
  idle_timeout: 30
});


export const db = drizzle(client, { schema });