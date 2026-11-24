// Plain constants shared by the zod schema (server) and form UI (client).
// Kept separate so client components don't pull zod into the browser bundle.
export const TITLE_MIN = 3;
export const TITLE_MAX = 120;
export const BODY_MAX = 20_000;
