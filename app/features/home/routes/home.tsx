import { Link } from "react-router";

import { getSessionUser } from "~/features/auth/auth.server";
import { Button } from "~/shared/components/ui/button";
import { siteConfig } from "~/shared/config/site";

import type { Route } from "./+types/home";

export const meta: Route.MetaFunction = () => [
  { title: siteConfig.name },
  { name: "description", content: siteConfig.description },
];

export async function loader({ request }: Route.LoaderArgs) {
  const { user } = await getSessionUser(request);
  return { signedIn: Boolean(user) };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <section className="grid gap-6 py-12 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">{siteConfig.name}</h1>
      <p className="text-muted-foreground">{siteConfig.description}</p>
      <div className="flex justify-center gap-3">
        {loaderData.signedIn ? (
          <Button asChild>
            <Link to="/posts">Go to my posts</Link>
          </Button>
        ) : (
          <>
            <Button asChild>
              <Link to="/register">Register</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/login">Log in</Link>
            </Button>
          </>
        )}
      </div>
    </section>
  );
}
