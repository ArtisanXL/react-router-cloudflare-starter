import { Link, Outlet } from "react-router";

import { siteConfig } from "~/shared/config/site";
import { logRequests } from "~/shared/middleware/log-requests.server";

import type { Route } from "./+types/main-layout";

export const middleware: Route.MiddlewareFunction[] = [logRequests];

export default function MainLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-3xl items-center px-4">
          <Link to="/" className="font-semibold">
            {siteConfig.name}
          </Link>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
