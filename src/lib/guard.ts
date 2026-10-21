import { toFriendlyError } from "./guardrails";

// Server-side request guard: rate limits, request ids, structured logs, safe errors.
//
// The limiter is in-memory, so it resets per serverless instance. That's fine for a
// portfolio demo; production would use a shared store (Upstash/Redis) so limits hold
// across instances.

const hits = new Map<string, number[]>();
const WINDOW_MS = 60 * 60 * 1000;
const BASE = Number(process.env.RATE_LIMIT_PER_HOUR ?? 30);
// Separate buckets so one route can't starve another; /api/answer gets headroom because
// every legitimate answer follows a (limited) /api/plan call.
const LIMITS = { index: BASE, plan: BASE, answer: BASE * 2, appeal: Math.ceil(BASE / 2) } as const;
export type Route = keyof typeof LIMITS;

export function rateLimited(req: Request, route: Route) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const key = `${route}:${ip}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 10_000) hits.clear(); // bound memory if hammered from many IPs
  return recent.length > LIMITS[route];
}

export const newRequestId = () => crypto.randomUUID().slice(0, 8);

/**
 * One JSON line per request: what happened and how long it took, never what the user wrote.
 * Render's Logs tab can search these fields (e.g. "status":"error" or a ref id).
 */
export function logEvent(fields: Record<string, unknown>) {
  console.log(JSON.stringify({ t: new Date().toISOString(), ...fields }));
}

/** Users get an actionable message and a reference id; the raw error stays in the logs. */
export function errorResponse(err: unknown, route: Route, rid: string, t0: number) {
  const f = toFriendlyError(err);
  logEvent({ event: "request", route, rid, status: "error", code: f.code, ms: Date.now() - t0, detail: String((err as Error)?.message ?? err).slice(0, 300) });
  return Response.json({ error: f.message, code: f.code, ref: rid }, { status: f.status });
}

export const tooMany = (route: Route, rid: string) => {
  logEvent({ event: "request", route, rid, status: "rate_limited" });
  return Response.json(
    { error: "You've reached this demo's hourly limit. Please try again later, or run ClaimClear locally with your own free key.", code: "rate_limited", ref: rid },
    { status: 429 },
  );
};
