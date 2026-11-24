import { redirect } from "react-router";

import { getUser } from "~/features/auth/auth.middleware.server";
import { notFound } from "~/shared/lib/http";
import { unprocessable, validateForm } from "~/shared/lib/validate";

import { PostForm } from "../components/post-form";
import { postIdSchema, postInputSchema } from "../posts.schema";
import { getPost, updatePost } from "../posts.server";
import type { Route } from "./+types/post-edit";

export const meta: Route.MetaFunction = () => [{ title: "Edit post" }];

function parseId(raw: string | undefined) {
  const id = postIdSchema.safeParse(raw);
  if (!id.success) notFound();
  return id.data;
}

export async function loader({ params, context }: Route.LoaderArgs) {
  const user = getUser(context);
  const post = await getPost(user.id, parseId(params.postId));
  if (!post) notFound();
  return { post: { id: post.id, title: post.title, body: post.body } };
}

export async function action({ request, params, context }: Route.ActionArgs) {
  const user = getUser(context);
  const id = parseId(params.postId);
  const result = validateForm(postInputSchema, await request.formData());
  if (!result.success) {
    // Don't leak validation details for posts the user doesn't own.
    if (!(await getPost(user.id, id))) notFound();
    return unprocessable(result);
  }
  const post = await updatePost(user.id, id, result.data);
  if (!post) notFound();
  throw redirect(`/posts/${post.id}`);
}

export default function EditPost({ loaderData, actionData }: Route.ComponentProps) {
  const { post } = loaderData;
  return (
    <section className="grid gap-6">
      <h1 className="text-2xl font-semibold">Edit post</h1>
      <PostForm
        defaultValues={post}
        failure={actionData}
        submitLabel="Save changes"
        cancelTo={`/posts/${post.id}`}
      />
    </section>
  );
}
