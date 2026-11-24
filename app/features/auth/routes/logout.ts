import { redirect } from "react-router";

import { signOut } from "../auth.server";
import type { Route } from "./+types/logout";

// Resource route: POST only. A GET (e.g. a prefetch) must never log you out.
export async function action({ request }: Route.ActionArgs) {
  const headers = await signOut(request);
  throw redirect("/", { headers });
}

export function loader() {
  throw redirect("/");
}
