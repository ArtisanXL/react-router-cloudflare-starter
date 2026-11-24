import type { MiddlewareFunction } from "react-router";

/**
 * Logs one structured line per server request: method, path, status, duration.
 * Note: inside Workers, timers only advance across I/O, so `durationMs`
 * reflects wall time spent waiting on I/O (D1, fetch), not pure CPU time.
 */
export const logRequests: MiddlewareFunction<Response> = async ({ request }, next) => {
  const start = performance.now();
  const { pathname } = new URL(request.url);
  let status = 500;
  try {
    const response = await next();
    status = response.status;
    return response;
  } finally {
    console.log(
      JSON.stringify({
        type: "request",
        method: request.method,
        path: pathname,
        status,
        durationMs: Math.round(performance.now() - start),
      }),
    );
  }
};
