import { env } from "cloudflare:workers";

type StringKeys = {
  [K in keyof Env]: Env[K] extends string ? K : never;
}[keyof Env];

/** Read a required string secret/var, failing loudly if it is missing. */
export function requireEnv(name: StringKeys): string {
  const value = env[name];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(
      `Missing required env var ${name}. Locally, copy .dev.vars.example to .dev.vars; in production run \`wrangler secret put ${name}\`.`,
    );
  }
  return value;
}
