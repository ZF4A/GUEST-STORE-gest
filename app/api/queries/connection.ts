import { env } from "../lib/env";
import * as schema from "@db/schema";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

const client = postgres(env.databaseUrl, { prepare: false, ssl: "require" });
const _db = drizzle(client, { schema });

export function getDb() {
  return _db;
}
