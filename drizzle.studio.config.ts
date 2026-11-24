import { readdirSync } from "node:fs";
import { join } from "node:path";

import { defineConfig } from "drizzle-kit";

// `npm run db:studio`: Drizzle Studio against the *local* D1 database that
// wrangler/miniflare persists under .wrangler/. Run `npm run db:migrate:local` first.
const dir = ".wrangler/state/v3/d1/miniflare-D1DatabaseObject";
const file = readdirSync(dir).find((f) => f.endsWith(".sqlite") && f !== "metadata.sqlite");
if (!file) throw new Error(`No local D1 database found in ${dir}. Run npm run db:migrate:local.`);

export default defineConfig({
  dialect: "sqlite",
  schema: "./database/schema.ts",
  dbCredentials: { url: `file:${join(dir, file)}` },
});
