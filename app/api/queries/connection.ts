import { env } from "../lib/env";
import * as schema from "@db/schema";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: { rejectUnauthorized: false },
  max: 3,
});

const _db = drizzle(pool, { schema });

export function getDb() {
  return _db;
}
