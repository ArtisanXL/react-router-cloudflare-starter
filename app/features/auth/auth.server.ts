import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { betterAuth } from "better-auth/minimal";

import * as schema from "@database/schema";
import { requireEnv } from "~/shared/config/env.server";
import { getDb } from "~/shared/lib/db.server";

import type { LoginInput, RegisterInput } from "./auth.schema";
import { hashPassword, verifyPassword } from "./password.server";

function createAuth() {
  return betterAuth({
    baseURL: requireEnv("BETTER_AUTH_URL"),
    secret: requireEnv("BETTER_AUTH_SECRET"),
    database: drizzleAdapter(getDb(), {
      provider: "sqlite",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
      // D1 has no interactive transactions.
      transaction: false,
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      password: { hash: hashPassword, verify: verifyPassword },
    },
    session: {
      // Signed cookie cache: most requests skip the D1 session lookup.
      cookieCache: { enabled: true, maxAge: 5 * 60 },
    },
    telemetry: { enabled: false },
  });
}

type Auth = ReturnType<typeof createAuth>;
let auth: Auth | undefined;

/** Lazily build the better-auth instance once per isolate (no module-scope work). */
function getAuth(): Auth {
  auth ??= createAuth();
  return auth;
}

export type SessionUser = Auth["$Infer"]["Session"]["user"];

export type AuthResult =
  | { ok: true; headers: Headers }
  | { ok: false; status: number; message: string };

function toFailure(error: unknown, fallback: string): AuthResult {
  if (error instanceof APIError) {
    return {
      ok: false,
      status: error.statusCode,
      message: error.body?.message ?? fallback,
    };
  }
  throw error;
}

/**
 * Resolve the current user from the request cookies.
 * `headers` may contain refreshed session cookies that must be forwarded.
 */
export async function getSessionUser(
  request: Request,
): Promise<{ user: SessionUser | null; headers: Headers }> {
  const { headers, response } = await getAuth().api.getSession({
    headers: request.headers,
    returnHeaders: true,
  });
  return { user: response?.user ?? null, headers };
}

export async function signUp(input: RegisterInput, request: Request): Promise<AuthResult> {
  try {
    const { headers } = await getAuth().api.signUpEmail({
      body: input,
      headers: request.headers,
      returnHeaders: true,
    });
    return { ok: true, headers };
  } catch (error) {
    return toFailure(error, "Could not create account.");
  }
}

export async function signIn(input: LoginInput, request: Request): Promise<AuthResult> {
  try {
    const { headers } = await getAuth().api.signInEmail({
      body: input,
      headers: request.headers,
      returnHeaders: true,
    });
    return { ok: true, headers };
  } catch (error) {
    return toFailure(error, "Invalid email or password.");
  }
}

export async function signOut(request: Request): Promise<Headers> {
  try {
    const { headers } = await getAuth().api.signOut({
      headers: request.headers,
      returnHeaders: true,
    });
    return headers;
  } catch (error) {
    // Already signed out / no session: nothing to clear server-side.
    if (error instanceof APIError) return new Headers();
    throw error;
  }
}
