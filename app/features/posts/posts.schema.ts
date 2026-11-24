import { z } from "zod";

import { BODY_MAX, TITLE_MAX, TITLE_MIN } from "./posts.constants";

export const postInputSchema = z.object({
  title: z
    .string({ error: "Title is required." })
    .trim()
    .min(TITLE_MIN, { error: `Title must be at least ${TITLE_MIN} characters.` })
    .max(TITLE_MAX, { error: `Title must be at most ${TITLE_MAX} characters.` }),
  body: z
    .string({ error: "Body is required." })
    .trim()
    .min(1, { error: "Body is required." })
    .max(BODY_MAX, { error: `Body must be at most ${BODY_MAX} characters.` }),
});

export type PostInput = z.infer<typeof postInputSchema>;

/** Post ids are UUIDs; anything else can never match and is treated as 404. */
export const postIdSchema = z.uuid();

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
});
