import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";

import * as schema from "@database/schema";

function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

export type Db = ReturnType<typeof createDb>;

let cached: Db | undefined;

/**
 * Drizzle client bound to the `DB` D1 binding. Created lazily on first use
 * (not at module scope) and reused for the lifetime of the isolate.
 */
export function getDb(): Db {
  cached ??= createDb(env.DB);
  return cached;
}
