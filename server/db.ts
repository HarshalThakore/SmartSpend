import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";

const isDev = process.env.NODE_ENV !== 'production';
const connectionString = isDev ? 
  'postgresql://postgres:postgres@localhost:5432/smartspend' : 
  `postgres://${process.env.AZURE_POSTGRESQL_USER}:${process.env.AZURE_POSTGRESQL_PASSWORD}@${process.env.AZURE_POSTGRESQL_HOST}:${process.env.AZURE_POSTGRESQL_PORT || '5432'}/${process.env.AZURE_POSTGRESQL_DATABASE}`;

const client = postgres(connectionString, {
  max: 10,
  ssl: {
    rejectUnauthorized: false
  },
  connect_timeout: 30,
  idle_timeout: 30
});


export const db = drizzle(client, { schema });