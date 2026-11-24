// Creates .dev.vars from .dev.vars.example with a freshly generated secret.
// Never overwrites an existing .dev.vars.
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

if (existsSync(".dev.vars")) {
  console.log(".dev.vars already exists, leaving it untouched.");
} else {
  const example = readFileSync(".dev.vars.example", "utf8");
  const secret = randomBytes(32).toString("base64");
  writeFileSync(
    ".dev.vars",
    example.replace(/^BETTER_AUTH_SECRET=.*$/m, `BETTER_AUTH_SECRET=${secret}`),
  );
  console.log("Created .dev.vars with a random BETTER_AUTH_SECRET.");
}
