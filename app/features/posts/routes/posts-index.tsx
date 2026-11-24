import { Link } from "react-router";

import { getUser } from "~/features/auth/auth.middleware.server";
import { Button } from "~/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/shared/components/ui/card";

import { listQuerySchema } from "../posts.schema";
import { listPosts } from "../posts.server";
import type { Route } from "./+types/posts-index";

export const meta: Route.MetaFunction = () => [{ title: "My posts" }];

export async function loader({ request, context }: Route.LoaderArgs) {
  const user = getUser(context);
  const url = new URL(request.url);
  const { page } = listQuerySchema.parse(Object.fromEntries(url.searchParams));
  return listPosts(user.id, { page });
}

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium" });

export default function PostsIndex({ loaderData }: Route.ComponentProps) {
  const { posts, page, hasNextPage } = loaderData;

  return (
    <section className="grid gap-6" aria-labelledby="posts-heading">
      <div className="flex items-center justify-between">
        <h1 id="posts-heading" className="text-2xl font-semibold">
          My posts
        </h1>
        <Button asChild>
          <Link to="/posts/new">New post</Link>
        </Button>
      </div>

      {posts.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-muted-foreground">
              {page === 1 ? "You have no posts yet." : "No posts on this page."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-3">
          {posts.map((post) => (
            <li key={post.id}>
              <Card className="gap-2 py-4">
                <CardHeader>
                  <CardTitle>
                    <h2>
                      <Link to={`/posts/${post.id}`} className="underline-offset-4 hover:underline">
                        {post.title}
                      </Link>
                    </h2>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    <time dateTime={new Date(post.createdAt).toISOString()}>
                      {dateFormat.format(new Date(post.createdAt))}
                    </time>
                  </p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {page > 1 || hasNextPage ? (
        <nav aria-label="Pagination" className="flex justify-between">
          {page > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link to={`?page=${page - 1}`}>Previous</Link>
            </Button>
          ) : (
            <span />
          )}
          {hasNextPage ? (
            <Button asChild variant="outline" size="sm">
              <Link to={`?page=${page + 1}`}>Next</Link>
            </Button>
          ) : null}
        </nav>
      ) : null}
    </section>
  );
}
