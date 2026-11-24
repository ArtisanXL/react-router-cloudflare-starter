import { type RouteConfig, index, layout, prefix, route } from "@react-router/dev/routes";

/**
 * Explicit route config. Each route module lives in its feature folder
 * (app/features/<feature>/routes); layouts shared by many features live in
 * app/shared/layouts.
 */
export default [
  // Main layout: request logging middleware + page chrome.
  layout("shared/layouts/main-layout.tsx", [
    index("features/home/routes/home.tsx"),

    route("login", "features/auth/routes/login.tsx"),
    route("register", "features/auth/routes/register.tsx"),
    route("logout", "features/auth/routes/logout.ts"),

    // Everything below requires a signed-in user (requireUser middleware).
    layout("features/auth/routes/authenticated-layout.tsx", [
      ...prefix("posts", [
        index("features/posts/routes/posts-index.tsx"),
        route("new", "features/posts/routes/post-new.tsx"),
        route(":postId", "features/posts/routes/post-detail.tsx"),
        route(":postId/edit", "features/posts/routes/post-edit.tsx"),
        route(":postId/delete", "features/posts/routes/post-delete.ts"),
      ]),
    ]),
  ]),
] satisfies RouteConfig;
