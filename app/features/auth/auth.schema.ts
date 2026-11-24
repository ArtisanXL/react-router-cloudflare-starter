import { z } from "zod";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Enter a valid email address." }));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, { error: "Password is required." }),
});

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "Name is required." })
    .max(80, { error: "Name must be at most 80 characters." }),
  email,
  password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters." })
    .max(128, { error: "Password must be at most 128 characters." }),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
