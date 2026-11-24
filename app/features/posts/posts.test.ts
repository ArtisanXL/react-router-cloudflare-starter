import { beforeEach, describe, expect, it } from "vitest";

import { posts, user } from "@database/schema";
import { getDb } from "~/shared/lib/db.server";

import { listQuerySchema, postIdSchema, postInputSchema } from "./posts.schema";
import { createPost, deletePost, getPost, listPosts, updatePost } from "./posts.server";

async function createUser(id: string) {
  await getDb()
    .insert(user)
    .values({ id, name: id, email: `${id}@example.com` })
    .onConflictDoNothing();
  return id;
}

describe("postInputSchema", () => {
  it("accepts a valid post and trims whitespace", () => {
    const result = postInputSchema.safeParse({ title: "  Hello  ", body: " Body " });
    expect(result.success && result.data).toEqual({ title: "Hello", body: "Body" });
  });

  it.each([
    ["ab", "title"],
    ["x".repeat(121), "title"],
    ["   ab   ", "title"], // too short after trim
  ])("rejects title %j", (title, field) => {
    const result = postInputSchema.safeParse({ title, body: "ok" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual([field]);
  });

  it("accepts title boundaries 3 and 120", () => {
    expect(postInputSchema.safeParse({ title: "abc", body: "b" }).success).toBe(true);
    expect(postInputSchema.safeParse({ title: "x".repeat(120), body: "b" }).success).toBe(true);
  });

  it("requires a body", () => {
    for (const body of [undefined, "", "   "]) {
      const result = postInputSchema.safeParse({ title: "Title", body });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe("Body is required.");
    }
  });

  it("validates ids and page numbers", () => {
    expect(postIdSchema.safeParse(crypto.randomUUID()).success).toBe(true);
    expect(postIdSchema.safeParse("1 OR 1=1").success).toBe(false);
    expect(listQuerySchema.parse({ page: "3" }).page).toBe(3);
    expect(listQuerySchema.parse({ page: "-1" }).page).toBe(1);
    expect(listQuerySchema.parse({}).page).toBe(1);
  });
});

describe("posts.server", () => {
  let alice: string;
  let bob: string;

  beforeEach(async () => {
    alice = await createUser(`alice-${crypto.randomUUID()}`);
    bob = await createUser(`bob-${crypto.randomUUID()}`);
  });

  it("creates and reads a post for its owner", async () => {
    const post = await createPost(alice, { title: "Hello", body: "World" });
    expect(post).toMatchObject({ userId: alice, title: "Hello", body: "World" });
    expect(await getPost(alice, post.id)).toMatchObject({ id: post.id });
  });

  it("hides other users' posts (read, update, delete)", async () => {
    const post = await createPost(alice, { title: "Private", body: "secret" });

    expect(await getPost(bob, post.id)).toBeUndefined();
    expect(await updatePost(bob, post.id, { title: "Hacked", body: "x" })).toBeUndefined();
    expect(await deletePost(bob, post.id)).toBe(false);

    // Untouched for the owner.
    expect(await getPost(alice, post.id)).toMatchObject({ title: "Private" });
  });

  it("updates and deletes own posts", async () => {
    const post = await createPost(alice, { title: "Before", body: "b" });
    const updated = await updatePost(alice, post.id, { title: "After", body: "a" });
    expect(updated).toMatchObject({ id: post.id, title: "After", body: "a" });

    expect(await deletePost(alice, post.id)).toBe(true);
    expect(await getPost(alice, post.id)).toBeUndefined();
    expect(await deletePost(alice, post.id)).toBe(false);
  });

  it("lists only the user's posts, newest first, paginated", async () => {
    const db = getDb();
    const base = Date.now();
    await db.insert(posts).values(
      Array.from({ length: 5 }, (_, i) => ({
        userId: alice,
        title: `Post ${i}`,
        body: "b",
        createdAt: new Date(base + i * 1000),
      })),
    );
    await createPost(bob, { title: "Bob's", body: "b" });

    const page1 = await listPosts(alice, { page: 1, pageSize: 2 });
    expect(page1.posts.map((p) => p.title)).toEqual(["Post 4", "Post 3"]);
    expect(page1.hasNextPage).toBe(true);

    const page3 = await listPosts(alice, { page: 3, pageSize: 2 });
    expect(page3.posts.map((p) => p.title)).toEqual(["Post 0"]);
    expect(page3.hasNextPage).toBe(false);

    // List never includes bodies (keeps the payload small).
    expect(page1.posts[0]).not.toHaveProperty("body");
  });
});
