import { createHash } from "node:crypto";
import { statSync } from "node:fs";

import { defineConfig, devices } from "@playwright/test";

// The main checkout uses 4173. A linked git worktree (its .git is a file) gets a stable port
// derived from its path, so parallel worktrees can run e2e at the same time. E2E_PORT overrides.
function previewPort() {
  if (process.env.E2E_PORT) return Number(process.env.E2E_PORT);
  if (!statSync(".git", { throwIfNoEntry: false })?.isFile()) return 4173;
  const hash = createHash("sha256").update(process.cwd()).digest().readUInt16BE(0);
  return 41_000 + (hash % 8_000);
}

const PORT = previewPort();

// Smoke tests run against the production build (`vite preview` in workerd)
// with local D1. Migrations are applied before the server starts.
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run db:migrate:local && npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
