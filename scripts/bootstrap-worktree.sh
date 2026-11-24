#!/usr/bin/env bash
# Makes a checkout ready to work in: .dev.vars, node_modules, git hooks, generated types and a
# migrated + seeded local D1. Idempotent: only does what is missing or stale, never fails.
#
# Runs from:
#   - paseo.json `worktree.setup` when Paseo creates a worktree (PASEO_* env is set),
#   - Claude Code SessionStart / SubagentStart hooks (.claude/settings.json),
#   - lefthook post-merge (a merge may change package-lock.json or add a migration),
#   - by hand: bash scripts/bootstrap-worktree.sh
#
# Each worktree is isolated without any port or database rewriting:
#   - local D1 lives in <worktree>/.wrangler (per directory), so worktrees never share data;
#   - the dev server port comes from Paseo (`dev` script, $PASEO_PORT) or Vite picks a free one;
#   - Playwright derives its preview port from the worktree path (playwright.config.ts).

# A SubagentStart hook gets JSON on stdin naming the subagent's working directory (`cwd`).
IFS= read -r -t 1 -d '' input
if [[ "$input" == *'"SubagentStart"'* ]] && command -v jq >/dev/null 2>&1; then
    subagent_dir=$(git -C "$(jq -r '.cwd // empty' <<<"$input")" rev-parse --show-toplevel 2>/dev/null)
fi

cd "${subagent_dir:-${PASEO_WORKTREE_PATH:-${CLAUDE_PROJECT_DIR:-.}}}" || exit 0
log() { echo "[bootstrap] $*" >&2; }

# Claude Code creates a subagent worktree (`worktree-agent-<hex>`) from the main checkout's
# local HEAD, which may be behind origin/main, so this script and the code could be stale.
# Move such a worktree onto origin/main and rerun the (now current) script once. Only a linked
# worktree on a `worktree-agent-*` branch with a clean tree and no commits of its own is touched.
if [[ -z "${BOOTSTRAP_FRESH_BASE:-}" && -f .git && "$(git branch --show-current)" == worktree-agent-* && -z "$(git status --porcelain 2>/dev/null)" ]]; then
    if timeout 20 git fetch --quiet origin main 2>/dev/null; then
        if git merge-base --is-ancestor HEAD refs/remotes/origin/main 2>/dev/null &&
            [[ "$(git rev-parse HEAD)" != "$(git rev-parse refs/remotes/origin/main)" ]]; then
            if git reset --hard --quiet refs/remotes/origin/main 2>/dev/null; then
                export BOOTSTRAP_FRESH_BASE=1
                exec bash "$PWD/scripts/bootstrap-worktree.sh" <<<"$input"
            fi
            log "Could not reset this worktree onto origin/main; branch from origin/main by hand."
        fi
    else
        log "Could not fetch origin/main; this worktree may be on a stale base."
    fi
fi

# .dev.vars is gitignored, so a linked worktree has none. Prefer the main checkout's copy (same
# secret, so sessions survive switching worktrees); otherwise generate one.
if [[ ! -f .dev.vars ]]; then
    main_checkout=${PASEO_SOURCE_CHECKOUT_PATH:-$(git worktree list --porcelain | sed -n '1s/^worktree //p')}
    if [[ -n "$main_checkout" && "$main_checkout" != "$PWD" && -f "$main_checkout/.dev.vars" ]]; then
        cp "$main_checkout/.dev.vars" .dev.vars && log "Copied .dev.vars from $main_checkout."
    else
        node scripts/setup-dev-vars.mjs >&2 || log "Could not create .dev.vars; copy .dev.vars.example by hand."
    fi
fi

# Missing or stale node_modules: a lockfile newer than npm's install marker means a merge or
# checkout changed it. `npm ci` also runs postinstall (wrangler types) and prepare (lefthook).
if [[ ! -d node_modules || package-lock.json -nt node_modules/.package-lock.json ]]; then
    log "Installing npm dependencies..."
    timeout 600 npm ci --no-audit --no-fund --loglevel=error >&2 || log "npm ci failed"
fi

# Git hooks live in the shared git dir, so one install covers every worktree; reinstall only
# if they are gone (e.g. a clone whose `npm ci` skipped lifecycle scripts).
hooks_dir=$(git rev-parse --git-path hooks 2>/dev/null)
if [[ -d node_modules/lefthook && ! -f "$hooks_dir/pre-commit" ]]; then
    npx --no-install lefthook install >/dev/null 2>&1 || log "lefthook install failed"
fi

# Generated, gitignored types that editors and `tsc` need.
if [[ -d node_modules && ( ! -f worker-configuration.d.ts || wrangler.jsonc -nt worker-configuration.d.ts ) ]]; then
    npx --no-install wrangler types >/dev/null 2>&1 || log "wrangler types failed"
fi
if [[ -d node_modules && ! -d .react-router/types ]]; then
    npx --no-install react-router typegen >/dev/null 2>&1 || log "react-router typegen failed"
fi

# Local D1 for this directory. Applying migrations is idempotent (d1_migrations table); seed
# only a database that did not exist yet, so local data someone created is never touched.
if [[ -d node_modules ]]; then
    fresh_db=
    [[ -d .wrangler/state/v3/d1 ]] || fresh_db=1
    if timeout 120 npm run --silent db:migrate:local >/dev/null 2>&1; then
        if [[ -n "$fresh_db" ]]; then
            timeout 120 npm run --silent db:seed:local >/dev/null 2>&1 &&
                log "Created and seeded the local D1 database (demo@example.com / password123)." ||
                log "Seeding failed; run npm run db:seed:local to see why."
        fi
    else
        log "Local D1 migration failed; run npm run db:migrate:local to see why."
    fi
fi

exit 0
