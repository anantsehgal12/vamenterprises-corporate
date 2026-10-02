import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/src/db/schema";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) throw new Error("DATABASE_URL is missing or empty. Add a Neon/Postgres connection URL to .env and restart the dev server.");

export const sql = neon(databaseUrl);
export const db = drizzle({ client: sql, schema });
