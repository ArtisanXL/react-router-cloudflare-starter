import { expect, test } from "@playwright/test";

test("register → logout → login → create → edit → delete", async ({ page }) => {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  const password = "password123";

  // Logged-out users are sent to /login.
  await page.goto("/posts");
  await expect(page).toHaveURL(/\/login\?redirectTo=%2Fposts/);

  // Register
  await page.goto("/register");
  await page.getByLabel("Name").fill("E2E User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Register" }).click();
  await expect(page).toHaveURL(/\/posts$/);
  await expect(page.getByRole("heading", { name: "My posts" })).toBeVisible();

  // Logout, then login
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/posts$/);

  // Create: invalid first (server-side validation errors are rendered)
  await page.getByRole("link", { name: "New post" }).click();
  await page.getByLabel("Title").fill("ab");
  await page.getByRole("button", { name: "Create post" }).click();
  await expect(page.getByText("Title must be at least 3 characters.")).toBeVisible();
  await expect(page.getByText("Body is required.")).toBeVisible();
  await expect(page.getByLabel("Title")).toHaveAttribute("aria-invalid", "true");

  await page.getByLabel("Title").fill("My first post");
  await page.getByLabel("Body").fill("Hello from Playwright");
  await page.getByRole("button", { name: "Create post" }).click();
  await expect(page.getByRole("heading", { name: "My first post" })).toBeVisible();
  const postUrl = page.url();

  // Edit
  await page.getByRole("link", { name: "Edit" }).click();
  await page.getByLabel("Title").fill("My edited post");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page).toHaveURL(postUrl);
  await expect(page.getByRole("heading", { name: "My edited post" })).toBeVisible();

  // Delete (two-step confirm)
  await page.getByText("Delete…").click();
  await page.getByRole("button", { name: "Yes, delete post" }).click();
  await expect(page).toHaveURL(/\/posts$/);
  await expect(page.getByText("You have no posts yet.")).toBeVisible();

  // Deleted post is gone.
  const response = await page.goto(postUrl);
  expect(response?.status()).toBe(404);
});
