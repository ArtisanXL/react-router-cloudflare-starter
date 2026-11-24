import { and, desc, eq } from "drizzle-orm";

import { posts, type Post } from "@database/schema";
import { POSTS_PAGE_SIZE } from "~/shared/config/site";
import { getDb } from "~/shared/lib/db.server";

import type { PostInput } from "./posts.schema";

export type { Post };
export type PostSummary = Pick<Post, "id" | "title" | "createdAt" | "updatedAt">;

/**
 * Every query is scoped by `userId`: a post that belongs to someone else is
 * indistinguishable from a post that does not exist (callers return 404).
 */
const owned = (userId: string, id: string) => and(eq(posts.id, id), eq(posts.userId, userId));

export async function listPosts(
  userId: string,
  { page = 1, pageSize = POSTS_PAGE_SIZE }: { page?: number; pageSize?: number } = {},
): Promise<{ posts: PostSummary[]; page: number; hasNextPage: boolean }> {
  // Fetch one extra row to know if there is a next page without COUNT(*).
  const rows = await getDb()
    .select({
      id: posts.id,
      title: posts.title,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
    })
    .from(posts)
    .where(eq(posts.userId, userId))
    .orderBy(desc(posts.createdAt), desc(posts.id))
    .limit(pageSize + 1)
    .offset((page - 1) * pageSize);

  return {
    posts: rows.slice(0, pageSize),
    page,
    hasNextPage: rows.length > pageSize,
  };
}

export async function getPost(userId: string, id: string): Promise<Post | undefined> {
  return getDb().select().from(posts).where(owned(userId, id)).get();
}

export async function createPost(userId: string, input: PostInput): Promise<Post> {
  const [post] = await getDb()
    .insert(posts)
    .values({ userId, title: input.title, body: input.body })
    .returning();
  return post;
}

export async function updatePost(
  userId: string,
  id: string,
  input: PostInput,
): Promise<Post | undefined> {
  const [post] = await getDb()
    .update(posts)
    .set({ title: input.title, body: input.body, updatedAt: new Date() })
    .where(owned(userId, id))
    .returning();
  return post;
}

export async function deletePost(userId: string, id: string): Promise<boolean> {
  const deleted = await getDb().delete(posts).where(owned(userId, id)).returning({ id: posts.id });
  return deleted.length > 0;
}
