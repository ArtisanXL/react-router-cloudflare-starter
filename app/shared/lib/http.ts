import { data } from "react-router";

/** Throw from a loader/action to render the nearest ErrorBoundary with a 404. */
export function notFound(message = "Not Found"): never {
  throw data(message, { status: 404, statusText: "Not Found" });
}
