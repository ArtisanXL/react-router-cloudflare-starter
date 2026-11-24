import { redirect } from "react-router";

import { getUser } from "~/features/auth/auth.middleware.server";
import { unprocessable, validateForm } from "~/shared/lib/validate";

import { PostForm } from "../components/post-form";
import { postInputSchema } from "../posts.schema";
import { createPost } from "../posts.server";
import type { Route } from "./+types/post-new";

export const meta: Route.MetaFunction = () => [{ title: "New post" }];

export async function action({ request, context }: Route.ActionArgs) {
  const user = getUser(context);
  const result = validateForm(postInputSchema, await request.formData());
  if (!result.success) return unprocessable(result);

  const post = await createPost(user.id, result.data);
  throw redirect(`/posts/${post.id}`);
}

export default function NewPost({ actionData }: Route.ComponentProps) {
  return (
    <section className="grid gap-6">
      <h1 className="text-2xl font-semibold">New post</h1>
      <PostForm failure={actionData} submitLabel="Create post" cancelTo="/posts" />
    </section>
  );
}
