import { Form, Link, Outlet } from "react-router";

import { Button } from "~/shared/components/ui/button";

import { getUser, requireUser } from "../auth.middleware.server";
import type { Route } from "./+types/authenticated-layout";

export const middleware: Route.MiddlewareFunction[] = [requireUser];

// A loader makes client-side navigations hit the server, so requireUser
// runs on every navigation into this section (see React Router middleware docs).
export function loader({ context }: Route.LoaderArgs) {
  const user = getUser(context);
  return { user: { name: user.name, email: user.email } };
}

export default function AuthenticatedLayout({ loaderData }: Route.ComponentProps) {
  return (
    <div className="grid gap-6">
      <nav
        aria-label="Account"
        className="flex flex-wrap items-center justify-between gap-2 text-sm"
      >
        <Link to="/posts" className="font-medium underline-offset-4 hover:underline">
          My posts
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground">
            Signed in as <strong>{loaderData.user.name}</strong>
          </span>
          <Form method="post" action="/logout">
            <Button type="submit" variant="outline" size="sm">
              Log out
            </Button>
          </Form>
        </div>
      </nav>
      <Outlet />
    </div>
  );
}
