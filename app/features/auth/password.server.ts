/**
 * Password hashing with WebCrypto PBKDF2-SHA256.
 *
 * better-auth's default (scrypt in pure JS) burns tens of milliseconds of
 * billed CPU per sign-in on Workers. PBKDF2 via `crypto.subtle` runs natively.
 * 100k iterations is the maximum the Workers runtime allows.
 *
 * Format: pbkdf2$<iterations>$<saltB64>$<hashB64>
 */
const ITERATIONS = 100_000;
const KEY_BITS = 256;
const SALT_BYTES = 16;

const toB64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromB64 = (b64: string): Uint8Array<ArrayBuffer> =>
  Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

async function derive(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    KEY_BITS,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derive(password, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${toB64(salt)}$${toB64(hash)}`;
}

export async function verifyPassword({
  hash,
  password,
}: {
  hash: string;
  password: string;
}): Promise<boolean> {
  const [scheme, iter, saltB64, hashB64] = hash.split("$");
  const iterations = Number(iter);
  if (scheme !== "pbkdf2" || !saltB64 || !hashB64 || !Number.isInteger(iterations)) {
    return false;
  }
  if (iterations < 1 || iterations > ITERATIONS) return false;
  const expected = fromB64(hashB64);
  const actual = await derive(password, fromB64(saltB64), iterations);
  return constantTimeEqual(actual, expected);
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.byteLength !== b.byteLength) return false;
  let diff = 0;
  for (let i = 0; i < a.byteLength; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}
