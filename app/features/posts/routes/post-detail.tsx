import { Link } from "react-router";

import { getUser } from "~/features/auth/auth.middleware.server";
import { Button } from "~/shared/components/ui/button";
import { notFound } from "~/shared/lib/http";

import { DeletePostButton } from "../components/delete-post-button";
import { postIdSchema } from "../posts.schema";
import { getPost } from "../posts.server";
import type { Route } from "./+types/post-detail";

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.post.title ?? "Post not found" },
];

export async function loader({ params, context }: Route.LoaderArgs) {
  const user = getUser(context);
  const id = postIdSchema.safeParse(params.postId);
  if (!id.success) notFound();
  const post = await getPost(user.id, id.data);
  // Same 404 whether the post doesn't exist or belongs to someone else.
  if (!post) notFound();
  return { post };
}

export default function PostDetail({ loaderData }: Route.ComponentProps) {
  const { post } = loaderData;
  return (
    <article className="grid gap-6">
      <header className="grid gap-1">
        <h1 className="text-2xl font-semibold break-words">{post.title}</h1>
        <p className="text-xs text-muted-foreground">
          Updated{" "}
          <time dateTime={new Date(post.updatedAt).toISOString()}>
            {new Date(post.updatedAt).toLocaleString("en")}
          </time>
        </p>
      </header>
      <div className="break-words whitespace-pre-wrap">{post.body}</div>
      <div className="flex flex-wrap items-start gap-2">
        <Button asChild variant="outline">
          <Link to={`/posts/${post.id}/edit`}>Edit</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link to="/posts">Back to posts</Link>
        </Button>
      </div>
      <DeletePostButton postId={post.id} title={post.title} />
    </article>
  );
}
