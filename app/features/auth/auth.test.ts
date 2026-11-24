import { describe, expect, it } from "vitest";

import { loginSchema, registerSchema } from "./auth.schema";
import { getSessionUser, signIn, signOut, signUp } from "./auth.server";
import { hashPassword, verifyPassword } from "./password.server";

const ORIGIN = "http://localhost:5173";

function requestWithCookies(headers?: Headers) {
  const cookie = (headers?.getSetCookie() ?? []).map((c) => c.split(";")[0]).join("; ");
  return new Request(`${ORIGIN}/`, { headers: cookie ? { cookie } : {} });
}

describe("auth schemas", () => {
  it("normalizes email and requires 8+ char passwords on register", () => {
    const ok = registerSchema.safeParse({
      name: " Ada ",
      email: " ADA@Example.com ",
      password: "password123",
    });
    expect(ok.success && ok.data).toEqual({
      name: "Ada",
      email: "ada@example.com",
      password: "password123",
    });

    const bad = registerSchema.safeParse({ name: "", email: "nope", password: "short" });
    expect(bad.success).toBe(false);
    expect(bad.error?.issues.map((i) => i.path[0]).toSorted()).toEqual([
      "email",
      "name",
      "password",
    ]);
  });

  it("requires email and password on login", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
  });
});

describe("password hashing", () => {
  it("round-trips and rejects wrong passwords", async () => {
    const hash = await hashPassword("correct horse");
    expect(hash).toMatch(/^pbkdf2\$100000\$/);
    expect(await verifyPassword({ hash, password: "correct horse" })).toBe(true);
    expect(await verifyPassword({ hash, password: "wrong horse" })).toBe(false);
  });

  it("uses a random salt and rejects malformed hashes", async () => {
    expect(await hashPassword("same")).not.toBe(await hashPassword("same"));
    expect(await verifyPassword({ hash: "garbage", password: "x" })).toBe(false);
    expect(await verifyPassword({ hash: "pbkdf2$999999999$AA==$AA==", password: "x" })).toBe(false);
  });
});

describe("auth.server (better-auth on D1)", () => {
  it("signs up, resolves the session, signs out, and signs back in", async () => {
    const email = `user-${crypto.randomUUID()}@example.com`;
    const input = { name: "Test", email, password: "password123" };

    const signedUp = await signUp(input, requestWithCookies());
    expect(signedUp.ok).toBe(true);
    if (!signedUp.ok) return;

    const { user } = await getSessionUser(requestWithCookies(signedUp.headers));
    expect(user?.email).toBe(email);

    const cleared = await signOut(requestWithCookies(signedUp.headers));
    expect(cleared.getSetCookie().join(";")).toMatch(/Max-Age=0/i);

    const anon = await getSessionUser(requestWithCookies());
    expect(anon.user).toBeNull();

    const signedIn = await signIn({ email, password: "password123" }, requestWithCookies());
    expect(signedIn.ok).toBe(true);
  });

  it("rejects duplicate emails and wrong passwords", async () => {
    const email = `dup-${crypto.randomUUID()}@example.com`;
    const input = { name: "Dup", email, password: "password123" };
    expect((await signUp(input, requestWithCookies())).ok).toBe(true);

    const dup = await signUp(input, requestWithCookies());
    expect(dup.ok).toBe(false);

    const wrong = await signIn({ email, password: "not-the-password" }, requestWithCookies());
    expect(wrong).toMatchObject({ ok: false, status: 401 });
  });
});
