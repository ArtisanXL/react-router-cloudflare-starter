import { redirect } from "react-router";

import { getUser } from "~/features/auth/auth.middleware.server";
import { notFound } from "~/shared/lib/http";

import { postIdSchema } from "../posts.schema";
import { deletePost } from "../posts.server";
import type { Route } from "./+types/post-delete";

const methodNotAllowed = () =>
  new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });

// Resource route (no default export), POST only. The loader exists solely to
// answer GET/HEAD with 405 instead of React Router's generic 400.
export function loader() {
  throw methodNotAllowed();
}

export async function action({ request, params, context }: Route.ActionArgs) {
  if (request.method !== "POST") throw methodNotAllowed();
  const user = getUser(context);
  const id = postIdSchema.safeParse(params.postId);
  if (!id.success) notFound();
  const deleted = await deletePost(user.id, id.data);
  if (!deleted) notFound();
  throw redirect("/posts");
}
