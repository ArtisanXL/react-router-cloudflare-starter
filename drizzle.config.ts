import { defineConfig } from "drizzle-kit";

// Only used to *generate* SQL migrations from database/schema.ts.
// Migrations are applied with `wrangler d1 migrations apply` (see README).
export default defineConfig({
  dialect: "sqlite",
  schema: "./database/schema.ts",
  out: "./database/migrations",
});
