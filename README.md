# React Router Cloudflare Starter

A full-stack starter kit for **Cloudflare Workers**. It uses React Router v8 in framework mode, D1 with Drizzle ORM, zod, better-auth (email and password), and Tailwind v4 with shadcn/ui. It ships with a small example feature: signed-in users can create, read, update and delete their own posts. Rename the app in `package.json`, `wrangler.jsonc` and `app/shared/config/site.ts`.

## Quick start

Requires Node **26.13.1** (pinned in `.nvmrc`; CI uses the same file) (see `.nvmrc`).

```sh
npm run setup
```

`npm run setup` does the following:

1. Runs `npm install`, which also installs the git hooks.
2. Creates `.dev.vars` from `.dev.vars.example` with a random secret.
3. Applies the migrations to the local D1 database.
4. Seeds the local database.
5. Starts the dev server on http://localhost:5173.

Seeded login: `demo@example.com` / `password123`.

## Commands

| Command                           | What it does                                                                   |
| --------------------------------- | ------------------------------------------------------------------------------ |
| `npm run dev`                     | Vite dev server (workerd runtime, local D1)                                    |
| `npm run preview`                 | Production build served by `vite preview` on :4173                             |
| `npm run build`                   | Production build                                                               |
| `npm run check`                   | lint → format:check → typecheck → unit tests (same as CI)                      |
| `npm run lint` / `lint:fix`       | Oxlint (type-aware)                                                            |
| `npm run format` / `format:check` | Oxfmt                                                                          |
| `npm run typecheck`               | `wrangler types && react-router typegen && tsc -b` (TypeScript 7)              |
| `npm test`                        | Vitest inside workerd with a real local D1                                     |
| `npm run test:e2e`                | Playwright smoke test (builds and starts `vite preview` itself)                |
| `npm run knip`                    | Unused files, exports and dependencies                                         |
| `npm run db:generate`             | Generate a SQL migration from `database/schema.ts` (drizzle-kit)               |
| `npm run db:migrate:local`        | Apply migrations to local D1                                                   |
| `npm run db:seed:local`           | Run every `database/seeds/*.sql` against local D1 (idempotent)                 |
| `npm run db:studio`               | Drizzle Studio on the local D1 SQLite file (open https://local.drizzle.studio) |

Run `npm run typecheck` (or `npx wrangler types`) after every change to `wrangler.jsonc`.

### Database workflow

1. Edit `database/schema.ts`. It is the single schema file for all tables, because drizzle-kit needs one entry.
2. Run `npm run db:generate -- --name <change>`. This writes `database/migrations/NNNN_<change>.sql`.
3. Run `npm run db:migrate:local`. Wrangler applies the migration (`migrations_dir` points to `database/migrations`).

Drizzle-kit only _generates_ SQL. Wrangler _applies_ it, locally and remotely, and tracks what has run in the `d1_migrations` table.

## Project structure

```
app/
  routes.ts                  # explicit route config pointing into features
  root.tsx
  features/
    auth/    routes/ auth.server.ts auth.middleware.server.ts auth.schema.ts password.server.ts auth.test.ts
    posts/   routes/ components/ posts.server.ts posts.schema.ts posts.constants.ts posts.test.ts
    home/    routes/
  shared/
    components/ui/           # shadcn/ui (Button, Input, Textarea, Card, Label)
    components/form-field.tsx
    layouts/main-layout.tsx  # page chrome + log-requests middleware
    middleware/log-requests.server.ts
    lib/                     # db.server.ts, validate.ts, http.ts, utils.ts
    config/                  # site.ts, env.server.ts
database/  schema.ts  migrations/  seeds/
workers/app.ts               # the one Worker entry
tests/e2e/                   # Playwright
tests/vitest/                # Vitest setup (applies D1 migrations)
```

### Conventions

- **A feature owns everything it needs** in one folder: routes, components, queries (`*.server.ts`), zod schemas and colocated tests.
- **Dependency direction.** A feature may import from `shared`. `shared` never imports from a feature. One feature uses another only through that feature's exported `*.server.ts` modules (for example `~/features/auth/auth.middleware.server`), never through its components, routes or schemas. **Oxlint enforces these rules** with `no-restricted-imports` in `.oxlintrc.json`, and it also bans `react-router-dom`.
- **Use the `.server.ts` suffix** for anything that touches the DB, secrets or `env`. React Router refuses to put such a module in the client bundle.
- **Keep route modules thin.** A `loader`/`action` validates input with zod (`validateForm`), calls the feature's `*.server.ts` functions, and returns `data()` / `redirect()`. There is no controller layer.
- **Read bindings and secrets** with `import { env } from "cloudflare:workers"` (as the starter does), never `context.cloudflare.env`.
- **Auth.** The `requireUser` middleware sits on `features/auth/routes/authenticated-layout.tsx`. It redirects to `/login?redirectTo=…` and exposes the user through a typed `createContext`. Read it with `getUser(context)`.
- **Ownership.** Every posts query filters by `user_id`. Someone else's post is a **404**, never a 403.
- **Validation errors** return **HTTP 422** with `fieldErrors`. Forms render them with `aria-invalid` and `aria-describedby`.
- **Keep one Worker.**

## Worktrees (Paseo / Claude Code)

`scripts/bootstrap-worktree.sh` makes any checkout ready to work in and is idempotent:

1. Copies `.dev.vars` from the main checkout. If there is none, it generates one.
2. Runs `npm ci` when `node_modules` is missing or stale.
3. Installs the git hooks and generates the gitignored types.
4. Migrates the local D1 database. It seeds the database only when it was just created.

These run it:

- `paseo.json` → `worktree.setup`.
- Claude Code SessionStart and SubagentStart hooks (`.claude/settings.json`). `.worktreeinclude` also copies `.dev.vars` into Claude Code worktrees.
- lefthook post-merge.
- You, by hand: `bash scripts/bootstrap-worktree.sh`.

Worktrees don't collide, and no port or database rewriting is needed:

- **Local D1** lives in each worktree's own `.wrangler/`.
- **The Paseo `dev` service** listens on the port Paseo assigns (`$PASEO_PORT`).
- **Playwright** uses 4173 in the main checkout. A linked worktree gets a stable port from its path (override with `E2E_PORT`).

The Paseo scripts are `dev` (service), `check` and `e2e`.

## Deploying (not automated)

Nothing in this repo deploys or creates remote resources. Do this by hand when you're ready:

```sh
npx wrangler d1 create app-db          # paste the returned database_id into wrangler.jsonc
npx wrangler d1 migrations apply app-db --remote
npx wrangler secret put BETTER_AUTH_SECRET      # openssl rand -base64 32
npx wrangler secret put BETTER_AUTH_URL         # e.g. https://react-router-cloudflare-starter.<you>.workers.dev
npm run deploy
```

`BETTER_AUTH_URL` must be the public origin. Locally it is `http://localhost:5173`.

## Cost and runtime notes

- Workers bill on requests and CPU time. I/O wait is not billed, and static assets are free.
- **Free plan: 10 ms CPU per invocation. A Paid plan is realistic for production.** Sign-up and sign-in derive a PBKDF2 key, SSR renders React, and better-auth initializes once per isolate. Together these can exceed 10 ms on cold isolates.
- Password hashing uses WebCrypto PBKDF2-SHA256 at 100k iterations, the Workers maximum. better-auth's default is pure-JS scrypt, which costs far more billed CPU.
- The better-auth session cookie cache is on (5 minutes), so most requests skip the D1 session lookup.
- Nothing heavy runs in module scope. The DB client and auth instance are created lazily, once per isolate.
- Every list query is paginated (`LIMIT pageSize + 1`; no `COUNT(*)`).
- Limits: 128 MB memory, no filesystem, no native modules. Bundle limit is 64 MiB uncompressed.

**Bundle** (`npx wrangler deploy --dry-run --outdir=<tmp>`): Total Upload **≈ 2077 KiB / gzip ≈ 460 KiB**. Approximate pre-minification shares: react-dom 20%, react-router 17%, zod 13%. The better-auth family is ≈ 35% combined (better-auth, @better-auth/core, jose, @noble/*, better-call). No single dependency dominates.

## Tooling notes

- **Tests.** Unit tests use `@cloudflare/vitest-plugin`, the renamed successor of `@cloudflare/vitest-pool-workers`, which is deprecated. `vitest.config.ts` is separate from `vite.config.ts`.
- **TypeScript 7** (native `tsc`). There is no `baseUrl`; `paths` start with `./`, and `types` are listed explicitly. VS Code needs the TypeScript Native Preview extension for the TS 7 language service.
- **Oxlint** runs type-aware (via `oxlint-tsgolint`) with the react, react-hooks, jsx-a11y, typescript, import, unicorn and vitest rules. **Oxfmt** sorts imports and Tailwind classes. Both are pinned to exact versions because Oxfmt is still 0.x.
- **Git hooks (lefthook).** pre-commit runs oxlint and oxfmt on staged files. pre-push runs typecheck and tests.
- **knip** ignores `@react-router/node`. Its React Router plugin assumes a Node adapter, but this app runs on Workers and does not need it.
- **Dependabot** (`.github/dependabot.yml`): weekly npm PRs grouped as React Router, Cloudflare, Oxc (pinned), minor+patch and major; grouped security PRs; monthly GitHub Actions PR. Actions are pinned by full SHA (the repo requires it).
- **CI** (`.github/workflows/ci.yml`) runs `npm ci`, `npm run check`, `npm run build`, then `wrangler deploy --dry-run`. A parallel `e2e` job runs the Playwright tests (`npm run test:e2e`) and uploads traces if they fail. CI never deploys.
