import { env } from "../lib/env";
import * as schema from "@db/schema";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

const client = postgres(env.databaseUrl, {
  prepare: false,
  ssl: "require",
  max: 3,
  idle_timeout: 20,
  connect_timeout: 30,
});

const _db = drizzle(client, { schema });

export function getDb() {
  return _db;
}
