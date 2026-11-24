import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

// Unit/integration tests run inside workerd with real (local) D1.
// Kept separate from vite.config.ts so the React Router plugin isn't loaded.
export default defineConfig(async () => {
  const migrations = await readD1Migrations("./database/migrations");

  return {
    plugins: [
      cloudflareTest({
        wrangler: { configPath: "./wrangler.jsonc" },
        miniflare: {
          bindings: {
            TEST_MIGRATIONS: migrations,
            BETTER_AUTH_SECRET: "test-secret-test-secret-test-secret-123",
            BETTER_AUTH_URL: "http://localhost:5173",
          },
        },
      }),
    ],
    resolve: { tsconfigPaths: true },
    test: {
      include: ["app/**/*.test.ts"],
      setupFiles: ["./tests/vitest/apply-migrations.ts"],
    },
  };
});
