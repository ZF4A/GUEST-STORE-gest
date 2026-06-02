import { env } from "../lib/env";
import * as schema from "@db/schema";

const url = env.databaseUrl;
const isPostgres = url.startsWith("postgresql://") || url.startsWith("postgres://");

let _db: ReturnType<typeof import("drizzle-orm/postgres-js").drizzle>;

if (isPostgres) {
  const { default: postgres } = await import("postgres");
  const { drizzle } = await import("drizzle-orm/postgres-js");
  // prepare: false required for Supabase Transaction Pooler (PgBouncer)
  const client = postgres(url, { prepare: false, ssl: "require" });
  _db = drizzle(client, { schema }) as any;
} else {
  const { default: Database } = await import("better-sqlite3");
  const { drizzle } = await import("drizzle-orm/better-sqlite3");
  _db = drizzle(new Database(url), { schema }) as any;
}

export function getDb() {
  return _db;
}
