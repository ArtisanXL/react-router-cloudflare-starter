import {
  createContext,
  redirect,
  type MiddlewareFunction,
  type RouterContextProvider,
} from "react-router";

import { getSessionUser, type SessionUser } from "./auth.server";

export type { SessionUser };

const userContext = createContext<SessionUser | null>(null);

function forwardCookies(from: Headers, to: Headers) {
  for (const cookie of from.getSetCookie()) to.append("Set-Cookie", cookie);
}

/**
 * Redirects anonymous users to /login?redirectTo=<current path> and exposes
 * the signed-in user to child loaders/actions via `getUser(context)`.
 */
export const requireUser: MiddlewareFunction<Response> = async ({ request, context }, next) => {
  const { user, headers } = await getSessionUser(request);
  if (!user) {
    // Only come back to pages that can be re-requested with GET.
    if (request.method !== "GET") throw redirect("/login");
    const url = new URL(request.url);
    const params = new URLSearchParams({ redirectTo: url.pathname + url.search });
    throw redirect(`/login?${params}`);
  }
  context.set(userContext, user);
  const response = await next();
  forwardCookies(headers, response.headers);
  return response;
};

/** The signed-in user. Only valid below a route that uses `requireUser`. */
export function getUser(context: Readonly<RouterContextProvider>): SessionUser {
  const user = context.get(userContext);
  if (!user) {
    throw new Error("getUser() called on a route without the requireUser middleware");
  }
  return user;
}

/** Redirect already-signed-in users away from /login and /register. */
export const redirectIfAuthenticated: MiddlewareFunction<Response> = async ({ request }, next) => {
  const { user } = await getSessionUser(request);
  if (user) throw redirect("/posts");
  return next();
};
